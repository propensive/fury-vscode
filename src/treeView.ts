import * as vscode from 'vscode';
import { getDependencies, getLayers, getModules, getProjects } from './furyClient';

enum FuryItemType {
	Layer, Project, Module, Dependency
}

class FuryItem extends vscode.TreeItem {
	constructor(public label: string, public type: FuryItemType) {
		super(label, FuryItem.getCollapsibleState(type));
		this.contextValue = FuryItem.getContextValue(type);
	}

	private static getCollapsibleState(type: FuryItemType): vscode.TreeItemCollapsibleState {
		switch (type) {
			case FuryItemType.Layer:
				return vscode.TreeItemCollapsibleState.Expanded;
			case FuryItemType.Project:
			case FuryItemType.Module:
				return vscode.TreeItemCollapsibleState.Collapsed;
			default:
				return vscode.TreeItemCollapsibleState.None;
		}
	}

	private static getContextValue(type: FuryItemType): string {
		switch (type) {
			case FuryItemType.Layer:
				return 'furyLayer';
			case FuryItemType.Project:
				return 'furyProject';
			case FuryItemType.Module:
				return 'furyModule';
		  case FuryItemType.Dependency:
				return 'furyDependency';
			default:
				return '';
		}
	}
}

class FuryItemsProvider implements vscode.TreeDataProvider<FuryItem> {
	constructor(private workspaceRoot: string | undefined) { }

	getTreeItem(element: FuryItem): FuryItem {
		return element;
	}

	getChildren(element: FuryItem): Thenable<FuryItem[]> {
		if (!element) {
			return getLayers().then(layers => layers.map(layer => new FuryItem(layer, FuryItemType.Layer)));
		}

		switch (element.type) {
			case FuryItemType.Layer:
				const layer = element.label;
				return getProjects(layer).then(projects => projects.map(project => new FuryItem(project, FuryItemType.Project)));
			case FuryItemType.Project:
				const project = element.label;
				return getModules(project).then(modules => modules.map(module => new FuryItem(module, FuryItemType.Module)));
			case FuryItemType.Module:
				const module = element.label;
				// TODO: Dependencies should be listed after clicking on 'dependencies' item
				return getDependencies(module).then(dependencies => dependencies.map(dependency => new FuryItem(dependency, FuryItemType.Dependency)));
			default:
				return Promise.reject('Invalid fury item type.');
		}
	}
}

export function startTreeView() {
	const furyItemsProvider = new FuryItemsProvider(vscode.workspace.rootPath);
	const modulesTreeView = vscode.window.createTreeView('furyItems', {
		treeDataProvider: furyItemsProvider,
	});
}
