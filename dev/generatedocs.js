'use strict'

import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { execSync } from 'child_process'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'

let packagePath = path.resolve(__dirname, '..', 'package.json')
let inputPath = './lib/mondo.js'
let tmpDocPath = '/tmp/jsdoc/mondo-bank/lib/mondo.js'
let jsdocConf = './dev/jsdoc.conf.json'
let readmePath = './README.md'
let readmeTemplate = './dev/README.md.tmpl'
let docsPath = '/tmp/mondo-docs/'
let outputFiles = ['module-mondo-bank.html', 'mondo.js.html']
let readmeMethodsFile = outputFiles[0]

let pkg = require(packagePath)
let version = pkg.version
console.log('Generating docs for mondo', version)

let mondoContents = fs.readFileSync(inputPath, 'utf-8')

let charRange = [65, 91]
let charCount = charRange[0] - 1

mondoContents = mondoContents
  .replace(/See (https*:\/\/\S+)/g, 'See [$1]($1)')
  .replace(/@method /g, function () {
    charCount++
    if (charCount === charRange[1]) {
      charCount = charRange[0] - 1
    }
    return `@method ${String.fromCharCode(charCount)}___`
  })

fs.writeFileSync(tmpDocPath, mondoContents)
console.log('Created temporary files for jsdoc')

rimraf.sync(docsPath)
console.log('Deleted any previously generated docs')

let jsdocCommand = `node node_modules/.bin/jsdoc -d ${docsPath} -c ${jsdocConf} -r ${readmePath} ${tmpDocPath}`
execSync(jsdocCommand)
console.log('Generated docs')

outputFiles.forEach(function (outputFile) {
  let outputPath = docsPath + outputFile
  let mondoOutput = fs.readFileSync(outputPath, 'utf-8')
  mondoOutput = mondoOutput.replace(/\w+___/g, '')
  fs.writeFileSync(outputPath, mondoOutput)
})
console.log('Post-processed docs output')

let htmlInput = fs.readFileSync(docsPath + readmeMethodsFile, 'utf-8')

let $dom = cheerio.load(htmlInput)
$dom('table, h4.name, h5, dl, .param-desc').remove()
$dom('[class]').removeAttr('class')
$dom('div').each(function () {
  let $div = $dom(this)
  $div.replaceWith($div.contents())
})

let readmeMethodsOutput = $dom('article').html().replace(/(\s*\n)+/g, '\n')
readmeMethodsOutput = toMarkdown(readmeMethodsOutput)

let readmeOutput = fs.readFileSync(readmeTemplate, 'utf-8')
readmeOutput = readmeOutput.replace(/\$\$AUTOGENERATED\$\$/, readmeMethodsOutput)
readmeOutput = readmeOutput.replace(/\$\$VERSION\$\$/, version)

fs.writeFileSync(readmePath, readmeOutput)
console.log('Generated README.md')

console.log('Docs generation finished')