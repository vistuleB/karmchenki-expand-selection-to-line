// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


function tweakedSelection(selection: vscode.Selection, newStart: vscode.Position, newEnd: vscode.Position) {
	if (selection.active.isBefore(selection.anchor)) { return new vscode.Selection(newEnd, newStart); }
	return new vscode.Selection(newStart, newEnd);
}

function expandSelectionDownByLine(doc: vscode.TextDocument, selection: vscode.Selection): vscode.Selection {
	const zeStart = selection.start.with(selection.start.line, 0);
	const zeEnd = doc.lineAt(selection.end).rangeIncludingLineBreak.end;
	return tweakedSelection(selection, zeStart, zeEnd);
}

function expandSelectionUpByLine(doc: vscode.TextDocument, selection: vscode.Selection): vscode.Selection {
	const zeStart = (selection.start.line > 0) ?
		selection.start.with(selection.start.line - 1, 0) : selection.start.with(0, 0);
	const zeEnd = (selection.isEmpty || selection.end.character > 0) ?
		doc.lineAt(selection.end).rangeIncludingLineBreak.end : selection.end;
	return tweakedSelection(selection, zeStart, zeEnd);
}

function retractSelectionFromBottom(doc: vscode.TextDocument, selection: vscode.Selection): vscode.Selection {
	const prevBol = selection.end.with(selection.end.line - 1, 0);
	const zeEnd = (prevBol.isBefore(selection.start)) ? selection.start : prevBol;
	return tweakedSelection(selection, selection.start, zeEnd);
}

function retractSelectionFromTop(doc: vscode.TextDocument, selection: vscode.Selection): vscode.Selection {
	const nextBol = selection.start.with(selection.start.line + 1, 0);
	const zeStart = (nextBol.isAfter(selection.end)) ? selection.end : nextBol;
	return tweakedSelection(selection, zeStart, selection.end);
}

function bringActiveSelectionAnchorEndpointIntoView(editor: vscode.TextEditor, lineDelta: number) {
	if (editor.selections.length === 0) { return; }
	const anchor = editor.selections[0].anchor;
	const nextLine = anchor.with({ character: 0, line: Math.max(0, anchor.line + lineDelta) });
	editor.revealRange(new vscode.Range(anchor, nextLine), 0);
}

function bringActiveSelectionActiveEndpointIntoView(editor: vscode.TextEditor, lineDelta: number) {
	if (editor.selections.length === 0) { return; }
	const active = editor.selections[0].active;
	const nextLine = active.with({ character: 0, line: Math.max(active.line + lineDelta) });
	editor.revealRange(new vscode.Range(active, nextLine), 0);
}

function expandSelectionsDownByLine(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	editor.selections = editor.selections.map(s => expandSelectionDownByLine(editor.document, s));
	bringActiveSelectionActiveEndpointIntoView(editor, 1);
}

function expandSelectionsUpByLine(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	editor.selections = editor.selections.map(s => expandSelectionUpByLine(editor.document, s));
	bringActiveSelectionAnchorEndpointIntoView(editor, -1);
}

function retractSelectionsFromBottom(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	editor.selections = editor.selections.map(s => retractSelectionFromBottom(editor.document, s));
	bringActiveSelectionActiveEndpointIntoView(editor, 1);
}

function retractSelectionsFromTop(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	editor.selections = editor.selections.map(s => retractSelectionFromTop(editor.document, s));
	bringActiveSelectionAnchorEndpointIntoView(editor, -1);
}

interface VanillaCommand {
	name: string;
	func: (p1: vscode.TextEditor, p2: vscode.TextEditorEdit) => void;
}

function registerCommands(extensionId: string, context: vscode.ExtensionContext, zeList: VanillaCommand[]) {
	zeList.forEach(z => vscode.commands.registerTextEditorCommand(extensionId + '.' + z.name, z.func));
}

export function activate(context: vscode.ExtensionContext) {
	registerCommands(
		'karmchenki-expand-selection-to-line',
		context,
		[
			{ name: 'expandSelectionsDownByLine', func: expandSelectionsDownByLine },
			{ name: 'expandSelectionsUpByLine', func: expandSelectionsUpByLine },
			{ name: 'retractSelectionsFromBottom', func: retractSelectionsFromBottom },
			{ name: 'retractSelectionsFromTop', func: retractSelectionsFromTop }
		]
	);
}

export function deactivate() { }
