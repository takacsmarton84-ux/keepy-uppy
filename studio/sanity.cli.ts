import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: '70ogbzto', dataset: 'production'},
  // The Studio is published at https://keepyuppy.sanity.studio
  studioHost: 'keepyuppy',
  deployment: {appId: 'a7uxuw0b2bpp7ypihiuzskbx'},
})
