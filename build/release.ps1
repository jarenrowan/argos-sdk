
if (Test-Path .\deploy) {
	Remove-Item -Path .\deploy -Recurse -Force
}

New-Item -ItemType Directory deploy\content\javascript
New-Item -ItemType Directory deploy\content\javascript\cultures
New-Item -ItemType Directory deploy\content\images
New-Item -ItemType Directory deploy\content\css\themes\crm
New-Item -ItemType Directory deploy\content\dojo\dojo\selector
New-Item -ItemType Directory deploy\content\dojo\dijit
New-Item -ItemType Directory deploy\content\dojo\dojox

grunt clean:css clean:js less
yarn run build

Copy-Item node_modules\babel-polyfill\dist\polyfill.min.js deps\babel-polyfill\
Copy-Item node_modules\moment\min\moment-with-locales.js deps\moment\
Copy-Item node_modules\rx-lite\rx.lite.js deps\rx-lite\
Copy-Item node_modules\@infor\icrm-js-common\dist\bundles\common.bundle.js deps\icrm-js-common\
Copy-Item node_modules\@infor\icrm-js-customization\dist\bundles\customization.bundle.js deps\icrm-js-customization\
Copy-Item node_modules\@infor\icrm-js-services\dist\bundles\icrm-js-services.js deps\icrm-js-services\
Copy-Item node_modules\redux\dist\redux.min.js deps\redux\
Copy-Item node_modules\jquery\dist\jquery.js deps\jquery\
Copy-Item node_modules\@infor\sohoxi\dist\js\sohoxi.js deps\sohoxijs\
Copy-Item node_modules\@infor\sohoxi\dist\css\*.css deps\sohoxicss\
Copy-Item node_modules\@infor\sohoxi\dist\js\cultures\*.js deps\sohoxicultures\

grunt argos-deps
grunt uglify

Copy-Item localization\locales\argos\*.l20n deploy\localization\locales\argos\
Copy-Item min\*.css deploy\content\
Copy-Item deps\sohoxicss\*.css deploy\content\css\
Copy-Item content\images\*.png deploy\content\images\
Copy-Item content\images\*.gif deploy\content\images\
Copy-Item deps\sohoxicultures\*.js deploy\content\javascript\cultures\
Copy-Item libraries\dojo\dojo\dojo.js deploy\content\dojo\dojo\
Copy-Item libraries\dojo\dojo\cldr\ deploy\content\dojo\dojo\cldr\nls\ -Recurse -Container -Force -Filter "*.js"
