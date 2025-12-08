import { Card } from './scripts/card.js';

const COLUMNS = ['N°', 'Quien pide', 'Nombre de la carta', 'Cantidad', 'Precio', 'Total', 'Condición 1', 'Condición 2', 'Link'];
const URL_CARDKINGDOM_BASE = 'https://www.cardkingdom.com';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'add_all_cards_mint':
            sendResponse({ cards: addAllCardsMint() });
            break;
        case 'add_all_cards_ck':
            sendResponse({ cards: addAllCardsCK() });
            break;
        case 'export_cards_xlsx':
            exportCardsXlsx(request.data);
            break;
        case 'export_cards_csv':
            sendResponse({ data: exportCardsCsv(request.data) });
            break;
    }
});

function addAllCardsMint() {
    var cards = [];
    document.querySelectorAll('table#ShoppingCartDetail tr[id^=ShoppingCartRow]').forEach(row => {
        let card = new Card();
        let link = row.childNodes[3].childNodes[1];
        card.name = link.textContent;
        card.link = link.getAttribute('href').trim();
        card.edition = row.childNodes[5].textContent.trim();
        card.language = row.childNodes[7].textContent.trim();
        card.material = row.childNodes[9].textContent.trim();
        card.count = parseInt(row.childNodes[13].querySelector('option[selected=selected]').textContent.trim());
        card.price = parseFloat(row.childNodes[11].textContent.replace(/[^\d.-]/g, ''));
        cards.push(card);
    });
    return cards;
}

function addAllCardsCK() {
    var cards = [];
    document.querySelectorAll('div.row.cart-item-wrapper').forEach(node => {
        let card = new Card();
        let link = node.querySelector('a.product-link');
        card.name = link.querySelector('span.title').textContent.split('\n')[0].trim();
        let edition = link.querySelector('span.edition').textContent.split('\n');
        card.edition = edition[0].trim();
        card.rarity = edition[1].trim().replace('(', '').replace(')', '');
        card.condition = link.querySelector('span.style').textContent.trim();
        let url = URL.parse(link.getAttribute('href').trim(), URL_CARDKINGDOM_BASE);
        card.link = url.toString();

        let count = node.querySelector('a.btn.btn-default.dropdown-toggle').textContent;
        card.count = parseInt(count);

        let price = node.querySelector('div.item-price-wrapper small').textContent;
        card.price = parseFloat(price.replace(/[^\d.-]/g, ''));
        cards.push(card);
    });
    return cards;
}

function exportCardsXlsx(cards) {
    let personName = promptForName();
    var data = [];

    cards.forEach(card => {
        let cardName = `${card.name}${card.material.length > 0 ? ` (${card.material})` : ""}`;
        data.push({
            'n': '',
            'personName': personName,
            'cardName': cardName,
            'count': card.count,
            'price': card.price,
            'total': 0,
            'condition1': card.condition,
            'condition2': card.condition,
            'link': card.link
        });
    });

    let workbook = XLSX.utils.book_new();
    let worksheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'B2' });
    XLSX.utils.sheet_add_aoa(worksheet, [COLUMNS], { origin: 'B2' });
    XLSX.utils.sheet_add_aoa(worksheet, [['', '', '', { f: `SUM(E3:E${data.length + 2})` }, '', { f: `SUM(G3:G${data.length + 2})` }, '', '', '']], { origin: `B${data.length + 3}` });

    data.forEach((item, index) => {
        let row = (index + 3);
        worksheet[`J${row}`].l = { Target: item.link };
        worksheet[`G${row}`].f = `E${row}*F${row}`;
    });

    if (!worksheet["!cols"]) worksheet["!cols"] = [];

    for (let col = 0; col < 10; col++) {
        if (!worksheet["!cols"][col]) worksheet["!cols"][col] = { wch: 8 };
    }

    worksheet["!cols"][0].wpx = 20;
    worksheet["!cols"][1].wpx = 20;
    worksheet["!cols"][2].wpx = 150;
    worksheet["!cols"][3].wpx = 400;
    worksheet["!cols"][7].wpx = 70;
    worksheet["!cols"][8].wpx = 70;
    worksheet["!cols"][9].wpx = 600;

    let borderStyle = { style: 'thin', color: { rgb: 'FF000000' } };
    let border = {
        top: borderStyle,
        right: borderStyle,
        bottom: borderStyle,
        left: borderStyle
    };

    for (let col of "BCDEFGHIJ") {
        var alignment = col == 'H' || col == 'I' ? 'center' : 'left';

        worksheet[`${col}2`].s = {
            font: {
                name: "Calibri",
                sz: 11,
                color: { rgb: "FFFFFFFF" }
            },
            fill: {
                fgColor: { rgb: "FF002060" }
            },
            border: border,
            alignment: {
                horizontal: alignment
            }
        }

        for (let row = 3; row <= data.length + 3; row++) {
            if (col == 'E' || col == 'F' || col == 'G') {
                alignment = 'right';
            }

            let color = col == 'J' ? 'FF0563C1' : 'FF000000';

            worksheet[`${col}${row}`].s = {
                font: {
                    name: "Calibri",
                    sz: 11,
                    color: { rgb: color },
                },
                fill: {
                    fgColor: { rgb: 'FFE7E6E6' }
                },
                border: border,
                alignment: {
                    horizontal: alignment
                }
            }
        }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "cards.xlsx");
}

function exportCardsCsv(cards) {
    let personName = promptForName();
    var data = [COLUMNS.join(';')];
    var totalCount = 0;
    var totalAmount = 0;

    cards.forEach(card => {
        let cardName = `${card.name}${card.material.length > 0 ? ` (${card.material})` : ""}`;
        let total = card.count * card.price;
        totalCount += card.count;
        totalAmount += total;
        data.push(`;${personName};${cardName};${card.count};${card.price};${total};${card.condition};${card.condition};${card.link}`);
    });

    data.push(`;;;${totalCount};;${totalAmount};;;`);

    return data.join("\n");
}

function promptForName() {
    return prompt("Ingrese su nombre:", "Nombre");
}
