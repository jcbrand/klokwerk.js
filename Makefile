SOURCES		= $(wildcard spec/*.js) $(wildcard tests/*.js) klokwerk.js main.js tests_main.js
BOWER 		?= node_modules/.bin/bower
JSHINT 		?= node_modules/.bin/jshint
PHANTOMJS	?= node_modules/.bin/phantomjs

########################################################################
## Install dependencies

stamp-npm: package.json
	npm install
	touch stamp-npm

stamp-bower: stamp-npm bower.json
	$(BOWER) install
	touch stamp-bower

clean::
	rm -f stamp-npm stamp-bower
	rm -rf node_modules src/bower_components

########################################################################
## Tests

jshint: stamp-npm stamp-bower
	$(JSHINT) --config jshintrc $(SOURCES)

check:
	jshint
	$(PHANTOMJS) node_modules/phantom-jasmine/lib/run_jasmine_test.coffee tests.html

.PHONY: clean check jshint
