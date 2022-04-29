import { getFunctionMap, start, lambdaFrameworkMapper } from '@exobase/local'
import chalk from 'chalk'

const whitelist = [
  // 'enrichEventOnChange'
]

const functions = getFunctionMap(process.cwd())

start({
  port: process.env.PORT,
  framework: lambdaFrameworkMapper,
  functions: (whitelist.length > 0 ? functions.filter(f => whitelist.includes(f.function)) : functions).map((f) => {
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