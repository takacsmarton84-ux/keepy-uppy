import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Keepy-uppy',
  projectId: '70ogbzto',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
