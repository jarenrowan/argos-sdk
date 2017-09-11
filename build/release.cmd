@echo off

if exist deploy (
	rmdir deploy /S /Q
)

mkdir deploy\content\javascript
mkdir deploy\content\javascript\cultures
mkdir deploy\content\images
mkdir deploy\content\css\themes\crm
mkdir deploy\content\dojo\dojo\selector
mkdir deploy\content\dojo\dijit
mkdir deploy\content\dojo\dojox

call grunt clean:css clean:js less
call yarn run build

REM TODO probably remove this
xcopy node_modules\babel-polyfill\dist\polyfill.min.js deps\babel-polyfill\ /E /Y
xcopy node_modules\moment\min\moment-with-locales.js deps\moment\ /E /Y
xcopy node_modules\rx-lite\rx.lite.js deps\rx-lite\ /E /Y
xcopy node_modules\@infor\icrm-js-common\dist\bundles\common.bundle.js deps\icrm-js-common\ /E /Y
xcopy node_modules\@infor\icrm-js-customization\dist\bundles\customization.bundle.js deps\icrm-js-customization\ /E /Y
xcopy node_modules\@infor\icrm-js-services\dist\bundles\icrm-js-services.js deps\icrm-js-services\ /E /Y
xcopy node_modules\redux\dist\redux.min.js deps\redux\ /E /Y
xcopy node_modules\jquery\dist\jquery.js deps\jquery\ /E /Y
xcopy node_modules\@infor\sohoxi\dist\js\sohoxi.js deps\sohoxijs\ /E /Y
xcopy node_modules\@infor\sohoxi\dist\css\*.css deps\sohoxicss\ /E /Y
xcopy node_modules\@infor\sohoxi\dist\js\cultures\*.js deps\sohoxicultures\ /E /Y

call grunt argos-deps
call grunt uglify

xcopy localization\locales\argos\*.l20n deploy\localization\locales\argos\ /E /Y
xcopy min\*.css deploy\content\ /E /Y
xcopy deps\sohoxicss\*.css deploy\content\css\ /E /Y
xcopy deps\sohoxicultures\*.js deploy\content\javascript\cultures\  /E /Y
xcopy libraries\dojo\dojo\*.js deploy\content\dojo\dojo\  /E /Y
xcopy libraries\dojo\dojo\cldr\nls\*.js deploy\content\dojo\dojo\cldr\nls\  /E /Y

if %errorlevel% neq 0 exit /b %errorlevel%
