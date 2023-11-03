// RoomProcessing.ts
// CITATION: Refactoring into this class was assisted by CHAT GPT. The below methods were aided by Chat GPT in figuring
//           out initial logic and high-level implementation
export class RoomProcessing {


	public static findBuildingTable(document: any): any {
		return RoomProcessing.findTableByClass(document, "views-field views-field-field-building-address");
	}

	public static getBuildingLinks(table: any): any[] {
		const links = [];
		for (const row of table.childNodes) {
			if (row.nodeName === "tr") {
				const linkCell = row.childNodes.find((cell: any) => this.hasClassName(cell, "nothing"));
				const fullNameCell = row.childNodes.find((cell: any) => this.hasClassName(cell, "views-field-title"));
				const shortNameCell = row.childNodes.find((cell: any) => this.hasClassName(cell, "building-code"));
				const addressCell = row.childNodes.find((cell: any) => this.hasClassName(cell, "address"));
				const linkElement = this.findNodeByName(linkCell, "a");
				const href = linkElement ? linkElement.attrs.find((attr: any) => attr.name === "href").value : null;
				const fullNameElement = this.findNodeByName(fullNameCell, "a");
				const fullNameText = fullNameElement ? this.findNodeByName(fullNameElement, "#text").value : null;
				const shortNameText = this.findNodeByName(shortNameCell, "#text").value.trim();
				const addressText = this.findNodeByName(addressCell, "#text").value.trim();
				if (href && fullNameText && shortNameText && addressText) {
					links.push({
						href: href,
						fullname: fullNameText,
						shortname: shortNameText,
						address: addressText,
					});
				}
			}
		}
		return links;
	}

	public static hasClassName(node: any, className: string): boolean {
		return node.attrs && node.attrs.some((attr: any) => attr.name === "class" && attr.value.includes(className));
	}

	public static findNodeByName(parentNode: any, nodeName: string): any {
		if (!parentNode || !parentNode.childNodes) {
			return null;
		}
		for (const child of parentNode.childNodes) {
			if (child.nodeName === nodeName) {
				return child;
			}
		}
		return null;
	}

	public static findRoomTable(document: any): any {
		return RoomProcessing.findTableByClass(document, "views-field-field-room-number");
	}

	public static getRows(table: any): any[] {
		const rowsData = [];
		for (const row of table.childNodes) {
			if (row.nodeName === "tr") {
				const numberCell = this.findNodeByClass(row, "td", "views-field-field-room-number");
				const seatsCell = this.findNodeByClass(row, "td", "views-field-field-room-capacity");
				const furnitureCell = this.findNodeByClass(row, "td", "views-field-field-room-furniture");
				const typeCell = this.findNodeByClass(row, "td", "views-field-field-room-type");
				const hrefCell = this.findNodeByClass(row, "td", "views-field-nothing");
				const number = numberCell ? this.getTextContent(this.findNodeByName(numberCell, "a")) : "";
				const seats = seatsCell ? parseInt(this.getTextContent(seatsCell) as string, 10) : 0;
				const furniture = furnitureCell ? this.getTextContent(furnitureCell) : "";
				const type = typeCell ? this.getTextContent(typeCell) : ""; // Default value as empty string
				const href = hrefCell ? this.getHref(this.findNodeByName(hrefCell, "a")) : "";
				if (number !== null && seats !== null && furniture !== null && type !== null && href !== null) {
					rowsData.push({
						number, seats, furniture, type, href,
					});
				}
			}
		}
		return rowsData;
	}

	public static findNodeByClass(parentNode: any, nodeName: string, className: string): any {
		return parentNode.childNodes.find((node: any) =>
			node.nodeName === nodeName &&
			node.attrs && node.attrs.some((attr: any) => attr.name === "class" && attr.value.includes(className))
		);
	}

	public static getTextContent(node: any): string | null {
		const textNode = node.childNodes.find((child: any) => child.nodeName === "#text");
		return textNode ? textNode.value.trim() : null;
	}

	public static getHref(node: any): string | null {
		if (node && node.attrs) {
			for (const attr of node.attrs) {
				if (attr.name === "href") {
					return attr.value;
				}
			}
		}
		return null;
	}


	public static findTableByClass(node: any, className: string): any {
		if (!node || !node.childNodes) {
			return null;
		}
		for (const child of node.childNodes) {
			if (child.nodeName === "td" && child.attrs.some((attr: {name: string; value: string | string[];}) =>
				attr.name === "class" && attr.value.includes(className))) {
				return child.parentNode.parentNode;
			}
			const nestedResult = RoomProcessing.findTableByClass(child, className);
			if (nestedResult) {
				return nestedResult;
			}
		}
		return null;
	}
}
