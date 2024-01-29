// AWS Elastic Beanstalk does not allow symlinks, so npm link does not work.
// Instead, inject "common": "file:../common" into projects that need it.

import fs from 'fs-extra'

const backendPackage = fs.readJsonSync('./artifact/backend/package.json')
backendPackage.dependencies['common'] = 'file:../common'
fs.writeJsonSync('./artifact/backend/package.json', backendPackage)
