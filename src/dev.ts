import path from 'path'
import { getFunctionMap, start, lambdaFrameworkMapper } from '@exobase/local'
import chalk from 'chalk'

const functions = getFunctionMap({
  moduleDirectoryPath: path.join(__dirname, 'modules')
})

start({
  port: process.env.PORT,
  framework: lambdaFrameworkMapper,
  functions: functions.map((f) => {
    const func = require(f.paths.import).default
    return { ...f,
      func: (...args: any[]) => {
        console.log(chalk.green(`${f.module}.${f.function}(req)`))
        return func(...args)
      }
    }
  })
}, (p) => {
  console.log(`API running at http://localhost:${p}`)
})