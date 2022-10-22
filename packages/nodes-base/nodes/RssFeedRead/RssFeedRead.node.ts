import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import Parser from 'rss-parser';
import { URL } from 'url';

export class RssFeedRead implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RSS Read',
		name: 'rssFeedRead',
		icon: 'fa:rss',
		group: ['input'],
		version: 1,
		description: 'Reads data from an RSS Feed',
		defaults: {
			name: 'RSS Feed Read',
			color: '#b02020',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'URL of the RSS feed',
			},
			{
				displayName: 'Only New Items',
				name: 'onlyNew',
				type: 'boolean',
				default: false,
				required: true,
				description: 'Whether only new items should be returned',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			const url = this.getNodeParameter('url', 0) as string;
			const onlyNew = this.getNodeParameter('onlyNew', 0) as boolean;

			if (!url) {
				throw new NodeOperationError(this.getNode(), 'The parameter "URL" has to be set!');
			}

			if (!validateURL(url)) {
				throw new NodeOperationError(this.getNode(), 'The provided "URL" is not valid!');
			}

			const parser = new Parser();

			let feed: Parser.Output<IDataObject>;
			try {
				feed = await parser.parseURL(url);
			} catch (error) {
				if (error.code === 'ECONNREFUSED') {
					throw new NodeOperationError(
						this.getNode(),
						`It was not possible to connect to the URL. Please make sure the URL "${url}" it is valid!`,
					);
				}

				throw new NodeOperationError(this.getNode(), error);
			}

			let returnData: IDataObject[] = [];

			// For now we just take the items and ignore everything else
			if (feed.items) {
				feed.items.forEach((item) => {
					// @ts-ignore
					returnData.push(item);
				});
			}

			if (onlyNew === true) {
				if (returnData.length && !returnData[0].hasOwnProperty('title')) {
					throw new NodeOperationError(
						this.getNode(),
						'The RSS feed seems to be invalid as it does not contain a "title".',
					);
				}

				returnData = (
					await this.helpers.checkProcessedItemsAndRecord('title', returnData, 'node', {
						maxEntries: 100,
					})
				).new;
			}

			return [this.helpers.returnJsonArray(returnData)];
		} catch (error) {
			if (this.continueOnFail()) {
				return this.prepareOutputData([{ json: { error: error.message } }]);
			}
			throw error;
		}
	}
}

// Utility function

function validateURL(url: string) {
	try {
		const parseUrl = new URL(url);
		return true;
	} catch (err) {
		return false;
	}
}
