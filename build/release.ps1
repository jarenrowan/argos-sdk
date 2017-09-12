
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
