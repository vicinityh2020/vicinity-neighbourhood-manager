module.exports = function(grunt) {
// Project configuration
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
			},
			sloc: {
				services: {
					// options: {
					// 	reportType: 'json',
					// 	reportPath: 'logs/sloc_services.json',
					// },
					files: {
						'services/': ['**/**.js', '**/**.html', '*.js'],
					}
				},
				controllers: {
					// options: {
					// 	reportType: 'json',
					// 	reportPath: 'logs/sloc_controllers.json',
					// },
					files: {
						'controllers/': ['**/**.js']
					}
				},
				test: {
					// options: {
					// 	reportType: 'json',
					// 	reportPath: 'logs/sloc_test.json',
					// },
					files: {
						'test/': ['**/**.js'],
					}
				},
				routes: {
					// options: {
					// 	reportType: 'json',
					// 	reportPath: 'logs/sloc_routes.json',
					// },
					files: {
						'routes/': ['**/**.js', '*.js']
					}
				}
			}
	});
// Load NPM grunt modules
	grunt.loadNpmTasks('grunt-complexity');
	grunt.loadNpmTasks('grunt-sloc');
// Runnable tasks & groups
	grunt.registerTask('complexityAll', [ 'complexity:modules', 'complexity:functions']);
	grunt.registerTask('slocAll', [ 'sloc:services', 'sloc:controllers', 'sloc:test', 'sloc:routes']);

};
