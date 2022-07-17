import path from 'path'
import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import { getFunctionMap } from '@exobase/local'
import cmd from 'cmdish'
import bluebird from 'bluebird'

interface Func {
  module: string
  function: string
}

const build = async () => {
  cmd('rm -rf ./build')
  const functions = getFunctionMap({
    moduleDirectoryPath: path.join(__dirname, 'src', 'modules')
  })
  bluebird.map(functions, async (func) => {
    console.log(`building ${func.module}/${func.function}`)
    await compile(func)
    console.log(`done ${func.module}/${func.function}`)
  }, { concurrency: 5 })
}

const compile = async (func: Func) => {
  return await new Promise<void>((res, rej) => {
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
        if (err || stats?.hasErrors()) {
          console.log(stats)
          rej(err)
        } else res()
      }
    )
  }).catch(err => {
    console.error(err)
    throw err
  })
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
