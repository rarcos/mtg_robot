chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch(request.action) {
            case 'add_all_cards_mint':
                sendResponse({cards: addAllCardsMint()});
                break;    
            case 'add_all_cards_ck':
                sendResponse({cards: addAllCardsCK()});
                break;
            case 'export_cards_xlsx':
                exportCardsXlsx(request.data);
                break;
        }
    }
);

function addAllCardsMint() {
    var cards = [];
    document.querySelectorAll('table#ShoppingCartDetail tr[id^=ShoppingCartRow]').forEach(function(row) {
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
    document.querySelectorAll('div.row.cart-item-wrapper').forEach(function(node) {
        let card = new Card();
        let link = node.querySelector('a.product-link');
        card.name = link.querySelector('span.title').textContent.split('\n')[0].trim();
        let edition = link.querySelector('span.edition').textContent.split('\n');
        card.edition = edition[0].trim();
        card.rarity = edition[1].trim().replace('(', '').replace(')', '');
        card.condition = link.querySelector('span.style').textContent.trim();
        let url = URL.parse(link.getAttribute('href').trim(), 'https://cardkingdom.com');
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
    var data = [
        ['N°', 'Quien pide', 'Nombre de la carta', 'Cantidad', 'Precio', 'Total', 'Condición 1', 'Condición 2', 'Link']
    ];

    var totalCount = 0;
    var totalAmount = 0;
    cards.forEach(card => {
        let cardName = `${card.name}${card.material.length > 0 ? ` (${card.material})` : ""}`;
        let total = card.count * card.price;
        totalCount += card.count;
        totalAmount += total;
        let condition = card.condition.length > 0 ? card.condition : 'NM-M';
        data.push(['', '', cardName, card.count, card.price, total, condition, condition, card.link]);
    });
    data.push(['', '', '', totalCount, '', totalAmount, '', '', '']);

    let workbook = XLSX.utils.book_new();
    let worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "cards.xlsx");
}
