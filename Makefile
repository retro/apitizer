build: optimize minify

optimize:
	node node_modules/requirejs/bin/r.js -o build/build.js

minify:
	node_modules/uglify-js/bin/uglifyjs dist/apitizer.js -o dist/apitizer.min.js -c -m -r '$,require,exports'
