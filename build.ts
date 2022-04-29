import path from 'path'
import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import { getFunctionMap } from '@exobase/local'
import cmd from 'cmdish'

interface Func {
  module: string
  function: string
}

const whitelist = [
  // 'enrichEventOnChange'
]

const functions = getFunctionMap(__dirname)
cmd('rm -rf ./build')

for (const func of whitelist.length > 0 ? functions.filter(f => whitelist.includes(f.function)) : functions) {
  build(func).catch(err => {
    console.error(err)
  })
}

async function build(func: Func) {
  console.log(`processing: ${func.module}/${func.function}.js`)
  await compile(func)
  console.log(`compiled: ${func.module}/${func.function}.js`)
  await zip(func)
  console.log(`zipped: ${func.module}/${func.function}.js -> ${func.module}/${func.function}.zip`)
}

function compile(func: Func) {
  return new Promise<void>((res, rej) => {
    webpack(
      {
        entry: [`./src/modules/${func.module}/${func.function}.ts`],
        mode: (process.env.NODE_ENV as 'production' | 'development') ?? 'production',
        target: 'async-node14',
        output: {
          library: {
            type: 'commonjs2'
          },
          path: path.resolve(__dirname, 'build', 'modules', func.module),
          filename: `${func.function}.js`
        },
        resolve: {
          extensions: ['.ts', '.js']
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              use: ['ts-loader']
            }
          ]
        },
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              extractComments: false // false = do not generate LICENSE files
            })
          ]
        }
      },
      (err, stats) => {
        if (err || stats.hasErrors()) {
          console.log(stats)
          rej(err)
        }
        else res()
      }
    )
  }).catch(err => {
    console.error(err)
    throw err
  })
}

function zip(func: Func) {
  return cmd(`zip -q ${func.function}.zip ${func.function}.js`, {
    cwd: path.resolve(__dirname, 'build', 'modules', func.module)
  })
}
