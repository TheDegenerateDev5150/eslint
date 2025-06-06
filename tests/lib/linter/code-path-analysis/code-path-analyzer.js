/**
 * @fileoverview Tests for CodePathAnalyzer.
 * @author Toru Nagashima
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("node:assert"),
	fs = require("node:fs"),
	path = require("node:path"),
	{ Linter } = require("../../../../lib/linter"),
	debug = require("../../../../lib/linter/code-path-analysis/debug-helpers"),
	CodePath = require("../../../../lib/linter/code-path-analysis/code-path"),
	CodePathSegment = require("../../../../lib/linter/code-path-analysis/code-path-segment");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const expectedPattern = /\/\*expected\s+((?:.|[\r\n])+?)\s*\*\//gu;
const languageOptionsPattern = /\/\*languageOptions\s+((?:.|[\r\n])+?)\s*\*\//u;
const lineEndingPattern = /\r?\n/gu;
const linter = new Linter();

/**
 * Extracts the content of `/*expected` comments from a given source code.
 * It's expected DOT arrows.
 * @param {string} source A source code text.
 * @returns {string[]} DOT arrows.
 */
function getExpectedDotArrows(source) {
	expectedPattern.lastIndex = 0;

	const retv = [];
	let m;

	while ((m = expectedPattern.exec(source)) !== null) {
		retv.push(m[1].replace(lineEndingPattern, "\n"));
	}

	return retv;
}

/**
 * Extracts the content of a `/*languageOptions` comment from a given source code
 * and parses it as JSON.
 * @param {string} source A source code text.
 * @returns {Object} languageOptions configuration for linting the source code text.
 */
function getLanguageOptions(source) {
	const match = languageOptionsPattern.exec(source);

	if (match) {
		return JSON.parse(match[1]);
	}

	return {};
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("CodePathAnalyzer", () => {
	describe("interface of code paths", () => {
		let actual = [];

		beforeEach(() => {
			actual = [];
			linter.verify(
				"function foo(a) { if (a) return 0; else throw new Error(); }",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathStart(codePath) {
											actual.push(codePath);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);
		});

		it("should have `id` as unique string", () => {
			assert(typeof actual[0].id === "string");
			assert(typeof actual[1].id === "string");
			assert(actual[0].id !== actual[1].id);
		});

		it("should have `upper` as CodePath", () => {
			assert(actual[0].upper === null);
			assert(actual[1].upper === actual[0]);
		});

		it("should have `childCodePaths` as CodePath[]", () => {
			assert(Array.isArray(actual[0].childCodePaths));
			assert(Array.isArray(actual[1].childCodePaths));
			assert(actual[0].childCodePaths.length === 1);
			assert(actual[1].childCodePaths.length === 0);
			assert(actual[0].childCodePaths[0] === actual[1]);
		});

		it("should have `initialSegment` as CodePathSegment", () => {
			assert(actual[0].initialSegment instanceof CodePathSegment);
			assert(actual[1].initialSegment instanceof CodePathSegment);
			assert(actual[0].initialSegment.prevSegments.length === 0);
			assert(actual[1].initialSegment.prevSegments.length === 0);
		});

		it("should have `finalSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].finalSegments));
			assert(Array.isArray(actual[1].finalSegments));
			assert(actual[0].finalSegments.length === 1);
			assert(actual[1].finalSegments.length === 2);
			assert(actual[0].finalSegments[0].nextSegments.length === 0);
			assert(actual[1].finalSegments[0].nextSegments.length === 0);
			assert(actual[1].finalSegments[1].nextSegments.length === 0);

			// finalSegments should include returnedSegments and thrownSegments.
			assert(
				actual[0].finalSegments[0] === actual[0].returnedSegments[0],
			);
			assert(
				actual[1].finalSegments[0] === actual[1].returnedSegments[0],
			);
			assert(actual[1].finalSegments[1] === actual[1].thrownSegments[0]);
		});

		it("should have `returnedSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].returnedSegments));
			assert(Array.isArray(actual[1].returnedSegments));
			assert(actual[0].returnedSegments.length === 1);
			assert(actual[1].returnedSegments.length === 1);
			assert(actual[0].returnedSegments[0] instanceof CodePathSegment);
			assert(actual[1].returnedSegments[0] instanceof CodePathSegment);
		});

		it("should have `thrownSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].thrownSegments));
			assert(Array.isArray(actual[1].thrownSegments));
			assert(actual[0].thrownSegments.length === 0);
			assert(actual[1].thrownSegments.length === 1);
			assert(actual[1].thrownSegments[0] instanceof CodePathSegment);
		});
	});

	describe("interface of code path segments", () => {
		let actual = [];

		beforeEach(() => {
			actual = [];
			linter.verify(
				"function foo(a) { if (a) return 0; else throw new Error(); }",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathSegmentStart(segment) {
											actual.push(segment);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);
		});

		it("should have `id` as unique string", () => {
			assert(typeof actual[0].id === "string");
			assert(typeof actual[1].id === "string");
			assert(typeof actual[2].id === "string");
			assert(typeof actual[3].id === "string");
			assert(actual[0].id !== actual[1].id);
			assert(actual[0].id !== actual[2].id);
			assert(actual[0].id !== actual[3].id);
			assert(actual[1].id !== actual[2].id);
			assert(actual[1].id !== actual[3].id);
			assert(actual[2].id !== actual[3].id);
		});

		it("should have `nextSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].nextSegments));
			assert(Array.isArray(actual[1].nextSegments));
			assert(Array.isArray(actual[2].nextSegments));
			assert(Array.isArray(actual[3].nextSegments));
			assert(actual[0].nextSegments.length === 0);
			assert(actual[1].nextSegments.length === 2);
			assert(actual[2].nextSegments.length === 0);
			assert(actual[3].nextSegments.length === 0);
			assert(actual[1].nextSegments[0] === actual[2]);
			assert(actual[1].nextSegments[1] === actual[3]);
		});

		it("should have `allNextSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].allNextSegments));
			assert(Array.isArray(actual[1].allNextSegments));
			assert(Array.isArray(actual[2].allNextSegments));
			assert(Array.isArray(actual[3].allNextSegments));
			assert(actual[0].allNextSegments.length === 0);
			assert(actual[1].allNextSegments.length === 2);
			assert(actual[2].allNextSegments.length === 1);
			assert(actual[3].allNextSegments.length === 1);
			assert(actual[2].allNextSegments[0].reachable === false);
			assert(actual[3].allNextSegments[0].reachable === false);
		});

		it("should have `prevSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].prevSegments));
			assert(Array.isArray(actual[1].prevSegments));
			assert(Array.isArray(actual[2].prevSegments));
			assert(Array.isArray(actual[3].prevSegments));
			assert(actual[0].prevSegments.length === 0);
			assert(actual[1].prevSegments.length === 0);
			assert(actual[2].prevSegments.length === 1);
			assert(actual[3].prevSegments.length === 1);
			assert(actual[2].prevSegments[0] === actual[1]);
			assert(actual[3].prevSegments[0] === actual[1]);
		});

		it("should have `allPrevSegments` as CodePathSegment[]", () => {
			assert(Array.isArray(actual[0].allPrevSegments));
			assert(Array.isArray(actual[1].allPrevSegments));
			assert(Array.isArray(actual[2].allPrevSegments));
			assert(Array.isArray(actual[3].allPrevSegments));
			assert(actual[0].allPrevSegments.length === 0);
			assert(actual[1].allPrevSegments.length === 0);
			assert(actual[2].allPrevSegments.length === 1);
			assert(actual[3].allPrevSegments.length === 1);
		});

		it("should have `reachable` as boolean", () => {
			assert(actual[0].reachable === true);
			assert(actual[1].reachable === true);
			assert(actual[2].reachable === true);
			assert(actual[3].reachable === true);
		});
	});

	describe("onCodePathStart", () => {
		it("should be fired at the head of programs/functions", () => {
			let count = 0;
			let lastCodePathNodeType = null;

			linter.verify(
				"foo(); function bar() {} var baz = function() {}; var qux = () => {};",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathStart(cp, node) {
											count += 1;
											lastCodePathNodeType = node.type;

											assert(cp instanceof CodePath);
											if (count === 1) {
												assert(node.type === "Program");
											} else if (count === 2) {
												assert(
													node.type ===
														"FunctionDeclaration",
												);
											} else if (count === 3) {
												assert(
													node.type ===
														"FunctionExpression",
												);
											} else if (count === 4) {
												assert(
													node.type ===
														"ArrowFunctionExpression",
												);
											}
										},
										Program() {
											assert(
												lastCodePathNodeType ===
													"Program",
											);
										},
										FunctionDeclaration() {
											assert(
												lastCodePathNodeType ===
													"FunctionDeclaration",
											);
										},
										FunctionExpression() {
											assert(
												lastCodePathNodeType ===
													"FunctionExpression",
											);
										},
										ArrowFunctionExpression() {
											assert(
												lastCodePathNodeType ===
													"ArrowFunctionExpression",
											);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);

			assert(count === 4);
		});
	});

	describe("onCodePathEnd", () => {
		it("should be fired at the end of programs/functions", () => {
			let count = 0;
			let lastNodeType = null;

			linter.verify(
				"foo(); function bar() {} var baz = function() {}; var qux = () => {};",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathEnd(cp, node) {
											count += 1;

											assert(cp instanceof CodePath);
											if (count === 4) {
												assert(node.type === "Program");
											} else if (count === 1) {
												assert(
													node.type ===
														"FunctionDeclaration",
												);
											} else if (count === 2) {
												assert(
													node.type ===
														"FunctionExpression",
												);
											} else if (count === 3) {
												assert(
													node.type ===
														"ArrowFunctionExpression",
												);
											}
											assert(node.type === lastNodeType);
										},
										"Program:exit"() {
											lastNodeType = "Program";
										},
										"FunctionDeclaration:exit"() {
											lastNodeType =
												"FunctionDeclaration";
										},
										"FunctionExpression:exit"() {
											lastNodeType = "FunctionExpression";
										},
										"ArrowFunctionExpression:exit"() {
											lastNodeType =
												"ArrowFunctionExpression";
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);

			assert(count === 4);
		});
	});

	describe("onCodePathSegmentStart", () => {
		it("should be fired at the head of programs/functions for the initial segment", () => {
			let count = 0;
			let lastCodePathNodeType = null;

			linter.verify(
				"foo(); function bar() {} var baz = function() {}; var qux = () => {};",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathSegmentStart(segment, node) {
											count += 1;
											lastCodePathNodeType = node.type;

											assert(
												segment instanceof
													CodePathSegment,
											);
											if (count === 1) {
												assert(node.type === "Program");
											} else if (count === 2) {
												assert(
													node.type ===
														"FunctionDeclaration",
												);
											} else if (count === 3) {
												assert(
													node.type ===
														"FunctionExpression",
												);
											} else if (count === 4) {
												assert(
													node.type ===
														"ArrowFunctionExpression",
												);
											}
										},
										Program() {
											assert(
												lastCodePathNodeType ===
													"Program",
											);
										},
										FunctionDeclaration() {
											assert(
												lastCodePathNodeType ===
													"FunctionDeclaration",
											);
										},
										FunctionExpression() {
											assert(
												lastCodePathNodeType ===
													"FunctionExpression",
											);
										},
										ArrowFunctionExpression() {
											assert(
												lastCodePathNodeType ===
													"ArrowFunctionExpression",
											);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);

			assert(count === 4);
		});
	});

	describe("onCodePathSegmentEnd", () => {
		it("should be fired at the end of programs/functions for the final segment", () => {
			let count = 0;
			let lastNodeType = null;

			linter.verify(
				"foo(); function bar() {} var baz = function() {}; var qux = () => {};",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathSegmentEnd(cp, node) {
											count += 1;

											assert(
												cp instanceof CodePathSegment,
											);
											if (count === 4) {
												assert(node.type === "Program");
											} else if (count === 1) {
												assert(
													node.type ===
														"FunctionDeclaration",
												);
											} else if (count === 2) {
												assert(
													node.type ===
														"FunctionExpression",
												);
											} else if (count === 3) {
												assert(
													node.type ===
														"ArrowFunctionExpression",
												);
											}
											assert(node.type === lastNodeType);
										},
										"Program:exit"() {
											lastNodeType = "Program";
										},
										"FunctionDeclaration:exit"() {
											lastNodeType =
												"FunctionDeclaration";
										},
										"FunctionExpression:exit"() {
											lastNodeType = "FunctionExpression";
										},
										"ArrowFunctionExpression:exit"() {
											lastNodeType =
												"ArrowFunctionExpression";
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);

			assert(count === 4);
		});
	});

	describe("onUnreachableCodePathSegmentStart", () => {
		it("should be fired after a throw", () => {
			let lastCodePathNodeType = null;

			linter.verify("throw 'boom'; foo();", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onUnreachableCodePathSegmentStart(
										segment,
										node,
									) {
										lastCodePathNodeType = node.type;

										assert(
											segment instanceof CodePathSegment,
										);
										assert.strictEqual(
											node.type,
											"ExpressionStatement",
										);
									},
									ExpressionStatement() {
										assert.strictEqual(
											lastCodePathNodeType,
											"ExpressionStatement",
										);
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});
		});

		it("should be fired after a return", () => {
			let lastCodePathNodeType = null;

			linter.verify("function foo() { return; foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onUnreachableCodePathSegmentStart(
										segment,
										node,
									) {
										lastCodePathNodeType = node.type;

										assert(
											segment instanceof CodePathSegment,
										);
										assert.strictEqual(
											node.type,
											"ExpressionStatement",
										);
									},
									ExpressionStatement() {
										assert.strictEqual(
											lastCodePathNodeType,
											"ExpressionStatement",
										);
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});
		});
	});

	describe("onUnreachableCodePathSegmentEnd", () => {
		it("should be fired after a throw", () => {
			let lastCodePathNodeType = null;

			linter.verify("throw 'boom'; foo();", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onUnreachableCodePathSegmentEnd(
										segment,
										node,
									) {
										lastCodePathNodeType = node.type;

										assert(
											segment instanceof CodePathSegment,
										);
										assert.strictEqual(
											node.type,
											"Program",
										);
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert.strictEqual(lastCodePathNodeType, "Program");
		});

		it("should be fired after a return", () => {
			let lastCodePathNodeType = null;

			linter.verify("function foo() { return; foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onUnreachableCodePathSegmentEnd(
										segment,
										node,
									) {
										lastCodePathNodeType = node.type;
										assert(
											segment instanceof CodePathSegment,
										);
										assert.strictEqual(
											node.type,
											"FunctionDeclaration",
										);
									},
									"Program:exit"() {
										assert.strictEqual(
											lastCodePathNodeType,
											"FunctionDeclaration",
										);
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});
		});

		it("should be fired after a return inside of function and if statement", () => {
			let lastCodePathNodeType = null;

			linter.verify(
				"function foo() { if (bar) { return; foo(); } else {} }",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onUnreachableCodePathSegmentEnd(
											segment,
											node,
										) {
											lastCodePathNodeType = node.type;
											assert(
												segment instanceof
													CodePathSegment,
											);
											assert.strictEqual(
												node.type,
												"BlockStatement",
											);
										},
										"Program:exit"() {
											assert.strictEqual(
												lastCodePathNodeType,
												"BlockStatement",
											);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);
		});

		it("should be fired at the end of programs/functions for the final segment", () => {
			let count = 0;
			let lastNodeType = null;

			linter.verify(
				"foo(); function bar() { return; } var baz = function() { return; }; var qux = () => { return; }; throw 'boom';",
				{
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onUnreachableCodePathSegmentEnd(
											cp,
											node,
										) {
											count += 1;

											assert(
												cp instanceof CodePathSegment,
											);
											if (count === 4) {
												assert(node.type === "Program");
											} else if (count === 1) {
												assert(
													node.type ===
														"FunctionDeclaration",
												);
											} else if (count === 2) {
												assert(
													node.type ===
														"FunctionExpression",
												);
											} else if (count === 3) {
												assert(
													node.type ===
														"ArrowFunctionExpression",
												);
											}
											assert(node.type === lastNodeType);
										},
										"Program:exit"() {
											lastNodeType = "Program";
										},
										"FunctionDeclaration:exit"() {
											lastNodeType =
												"FunctionDeclaration";
										},
										"FunctionExpression:exit"() {
											lastNodeType = "FunctionExpression";
										},
										"ArrowFunctionExpression:exit"() {
											lastNodeType =
												"ArrowFunctionExpression";
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
				},
			);

			assert(count === 4);
		});
	});

	describe("onCodePathSegmentLoop", () => {
		it("should be fired in `while` loops", () => {
			let count = 0;

			linter.verify("while (a) { foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onCodePathSegmentLoop(
										fromSegment,
										toSegment,
										node,
									) {
										count += 1;
										assert(
											fromSegment instanceof
												CodePathSegment,
										);
										assert(
											toSegment instanceof
												CodePathSegment,
										);
										assert(node.type === "WhileStatement");
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert(count === 1);
		});

		it("should be fired in `do-while` loops", () => {
			let count = 0;

			linter.verify("do { foo(); } while (a);", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onCodePathSegmentLoop(
										fromSegment,
										toSegment,
										node,
									) {
										count += 1;
										assert(
											fromSegment instanceof
												CodePathSegment,
										);
										assert(
											toSegment instanceof
												CodePathSegment,
										);
										assert(
											node.type === "DoWhileStatement",
										);
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert(count === 1);
		});

		it("should be fired in `for` loops", () => {
			let count = 0;

			linter.verify("for (var i = 0; i < 10; ++i) { foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onCodePathSegmentLoop(
										fromSegment,
										toSegment,
										node,
									) {
										count += 1;
										assert(
											fromSegment instanceof
												CodePathSegment,
										);
										assert(
											toSegment instanceof
												CodePathSegment,
										);

										if (count === 1) {
											// connect path: "update" -> "test"
											assert(
												node.parent.type ===
													"ForStatement",
											);
										} else if (count === 2) {
											assert(
												node.type === "ForStatement",
											);
										}
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert(count === 2);
		});

		it("should be fired in `for-in` loops", () => {
			let count = 0;

			linter.verify("for (var k in obj) { foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onCodePathSegmentLoop(
										fromSegment,
										toSegment,
										node,
									) {
										count += 1;
										assert(
											fromSegment instanceof
												CodePathSegment,
										);
										assert(
											toSegment instanceof
												CodePathSegment,
										);

										if (count === 1) {
											// connect path: "right" -> "left"
											assert(
												node.parent.type ===
													"ForInStatement",
											);
										} else if (count === 2) {
											assert(
												node.type === "ForInStatement",
											);
										}
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert(count === 2);
		});

		it("should be fired in `for-of` loops", () => {
			let count = 0;

			linter.verify("for (var x of xs) { foo(); }", {
				plugins: {
					"test-plugin": {
						rules: {
							"test-rule": {
								create: () => ({
									onCodePathSegmentLoop(
										fromSegment,
										toSegment,
										node,
									) {
										count += 1;
										assert(
											fromSegment instanceof
												CodePathSegment,
										);
										assert(
											toSegment instanceof
												CodePathSegment,
										);

										if (count === 1) {
											// connect path: "right" -> "left"
											assert(
												node.parent.type ===
													"ForOfStatement",
											);
										} else if (count === 2) {
											assert(
												node.type === "ForOfStatement",
											);
										}
									},
								}),
							},
						},
					},
				},
				rules: { "test-plugin/test-rule": 2 },
			});

			assert(count === 2);
		});
	});

	describe("completed code paths are correct", () => {
		const testDataDir = path.join(
			__dirname,
			"../../../fixtures/code-path-analysis/",
		);
		const testDataFiles = fs.readdirSync(testDataDir);

		testDataFiles.forEach(file => {
			it(file, () => {
				const source = fs.readFileSync(path.join(testDataDir, file), {
					encoding: "utf8",
				});
				const expected = getExpectedDotArrows(source);
				const actual = [];

				assert(
					expected.length > 0,
					"/*expected */ comments not found.",
				);

				const messages = linter.verify(source, {
					plugins: {
						"test-plugin": {
							rules: {
								"test-rule": {
									create: () => ({
										onCodePathEnd(codePath) {
											actual.push(
												debug.makeDotArrows(codePath),
											);
										},
									}),
								},
							},
						},
					},
					rules: { "test-plugin/test-rule": 2 },
					languageOptions: getLanguageOptions(source),
				});

				assert.strictEqual(
					messages.length,
					0,
					"Unexpected linting error in code.",
				);
				assert.strictEqual(
					actual.length,
					expected.length,
					"a count of code paths is wrong.",
				);

				for (let i = 0; i < actual.length; ++i) {
					assert.strictEqual(actual[i], expected[i]);
				}
			});
		});
	});
});
