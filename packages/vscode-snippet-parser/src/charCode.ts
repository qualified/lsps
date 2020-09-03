/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Names from https://blog.codinghorror.com/ascii-pronunciation-rules-for-programmers/

/**
 * An inlined enum containing useful character codes (to be used with String.charCodeAt).
 * Please leave the const keyword such that it gets inlined when compiled to JavaScript!
 */
export const enum CharCode {
	/**
	 * The `$` character.
	 */
	DollarSign = 36,
	/**
	 * The `+` character.
	 */
	Plus = 43,
	/**
	 * The `,` character.
	 */
	Comma = 44,
	/**
	 * The `-` character.
	 */
	Dash = 45,
	/**
	 * The `/` character.
	 */
	Slash = 47,

	Digit0 = 48,
	Digit9 = 57,

	/**
	 * The `:` character.
	 */
	Colon = 58,
	/**
	 * The `?` character.
	 */
	QuestionMark = 63,

	A = 65,
	Z = 90,

	/**
	 * The `\` character.
	 */
	Backslash = 92,
	/**
	 * The `_` character.
	 */
	Underline = 95,

	a = 97,
	z = 122,

	/**
	 * The `{` character.
	 */
	OpenCurlyBrace = 123,
	/**
	 * The `|` character.
	 */
	Pipe = 124,
	/**
	 * The `}` character.
	 */
	CloseCurlyBrace = 125,
}
