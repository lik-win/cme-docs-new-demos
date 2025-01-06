const fs = require('fs')
const path = require('path')

// 设置要搜索的文件夹路径
const folderPath = './upload'

// 图片文件的扩展名列表
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']

// 递归查找包含特定代码的文件并删除
function deleteFilesWithCodeAndImages(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      return console.error(err)
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file.name)

      if (file.isDirectory()) {
        deleteFilesWithCodeAndImages(filePath) // 递归搜索子目录
      } else {
        // 读取文件内容并检查是否包含特定代码
        fs.readFile(filePath, 'utf8', (err, data) => {
          // 如果文件不是文本文件，检查是否为图片文件
          if (
            imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
          ) {
            console.log(filePath, '图片文件')
            // 删除图片文件
            fs.unlink(filePath, (err) => {
              console.log(err)
              if (err) {
                return console.error(err)
              }
              console.log(`Deleted image: ${filePath}`)
            })
          }

          if (
            data.includes('src="/libs/message.js"') ||
            data.includes('apiInfo') ||
            data.includes('RADA_CREF_20230728120000_4326.tif') ||
            !data.includes('<title>底图切换</title>') ||
            !data.includes('libs/cme-core.umd.cjs')
          ) {
            // 删除包含特定代码的文件
            fs.unlink(filePath, (err) => {
              if (err) {
                return console.error(err)
              }
              console.log(`Deleted: ${filePath}`)
            })
          }
        })
      }
    })
  })
}

// 开始查找并删除文件
deleteFilesWithCodeAndImages(folderPath)
