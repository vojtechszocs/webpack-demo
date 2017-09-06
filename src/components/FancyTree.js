const treeUrl = require('./tree.jpg')

export default ({ container }) => {
  const image = document.createElement('img')
  image.src = treeUrl
  container.appendChild(image)
}
