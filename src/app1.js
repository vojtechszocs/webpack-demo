import { printStuff } from './utils'
import FancyTree from './components/FancyTree'

printStuff()

const appElement = document.getElementById('app')

FancyTree({ container: appElement })
