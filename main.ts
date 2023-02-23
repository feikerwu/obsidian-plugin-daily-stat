import { App, Editor, MarkdownView, Notice, Plugin, Setting } from "obsidian";
import dayjs from "dayjs";

// 存储当天一个文件的
type Daily = Record<string, { pre: number; cur: number }>;
type Count = Record<string, Daily>;

interface PluginSetting {
	counts: Count;
	// mySetting: string;
}

const DEFAULT_SETTINGS: PluginSetting = {
	counts: {},
};

export default class MyPlugin extends Plugin {
	settings: PluginSetting;
	private today: string = dayjs().format("YYYY-MM-DD");
	private todayCount: Daily = {};
	private counts: Count = {};
	private statusBarItemEl: any;

	async onload() {
		await this.loadSettings();

		this.checkTodayDate();

		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Show Activity Graph",
			(evt: MouseEvent) => {
				// 展示新的面板
				// console.log()
				this.flushToday();
				console.log(JSON.stringify(this.counts));

				new Notice("@TODO: 需要展示一个新的面板页面");
			}
		);

		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl = statusBarItemEl;
		// statusBarItemEl.setText(`具体的字符数`);

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => 200));

		this.onPageView();
	}

	onunload() {}

	onPageView() {
		this.app.workspace.on("quick-preview", ({ path }, content) => {
			this.checkTodayDate();

			this.getTodayCount(path, content);
			this.statusBarItemEl.setText(`today: ${this.getTodayTotalWords()}`);
			// console.log(path, content);
		});
	}

	getTodayCount(file: string, content: string) {
		const { todayCount } = this;

		const words = this.getTextWords(content);

		if (todayCount[file]) {
			todayCount[file].cur = words;
		} else {
			// 首次输入
			todayCount[file] = {
				pre: words,
				cur: words,
			};
		}
	}

	getTodayTotalWords() {
		let total = 0;
		for (let filePath in this.todayCount) {
			const { pre, cur } = this.todayCount[filePath];
			total += cur - pre;
		}
		return total;
	}
	// 如果天数发生变更, 则更新天数
	checkTodayDate() {
		const cur = dayjs().format("YYYY-MM-DD");
		if (this.today !== cur) {
			this.flushToday();
			this.today = cur;
			this.todayCount = this.counts[cur] || {};
		}
	}

	// 写入当天的记录
	flushToday() {
		if (this.today) {
			this.counts[this.today] = this.todayCount;
		}
	}

	getTextWords(content: string) {
		let words: number = 0;

		const matches = content.match(
			/[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
		);

		if (matches) {
			for (let match of matches) {
				words += match.charCodeAt(0) > 19968 ? match.length : 1;
			}
		}

		return words;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);

		this.counts = this.settings.counts;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
