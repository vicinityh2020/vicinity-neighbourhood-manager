module.exports = function(grunt) {
// Project configuration.
	grunt.initConfig({

		complexity: {
			modules: {
				src: ['controllers/*/*.js', 'services/*/*.js', 'services/*.js'],
				// exclude: ['doNotTest.js'],
				options: {
					breakOnErrors: false,
					// jsLintXML: 'report.xml',         // create XML JSLint-like report
					// checkstyleXML: 'checkstyle.xml', // create checkstyle report
					// pmdXML: 'pmd.xml',               // create pmd report
					errorsOnly: false,               // show only maintainability errors
					cyclomatic: 10,          // or optionally a single value, like 3 (Above consider complex function)
					halstead: 10,           // or optionally a single value, like 8 (Above consider complex function)
					maintainability: 100,   // max 171 (BEST)
					hideComplexFunctions: true,     // only display maintainability
					broadcast: false                 // broadcast data over event-bus
				}
			},
			functions: {
				src: ['controllers/*/*.js', 'services/*/*.js', 'services/*.js'],
				// exclude: ['doNotTest.js'],
				options: {
					breakOnErrors: false,
					// jsLintXML: 'report.xml',         // create XML JSLint-like report
					// checkstyleXML: 'checkstyle.xml', // create checkstyle report
					// pmdXML: 'pmd.xml',               // create pmd report
					errorsOnly: false,               // show only maintainability errors
					cyclomatic: 10,          // or optionally a single value, like 3 (Above consider complex function)
					halstead: 10,           // or optionally a single value, like 8 (Above consider complex function)
					maintainability: 100,   // max 171 (BEST)
					hideComplexFunctions: false,     // only display maintainability
					broadcast: false                 // broadcast data over event-bus
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-complexity');
	grunt.registerTask('default', [ 'complexity:modules', 'complexity:functions']);
};
