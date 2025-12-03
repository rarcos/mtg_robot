const URL_MTGMINTCARD = "https://www.mtgmintcard.com/shopping-cart";
const URL_CARDKINGDOM = "https://www.cardkingdom.com/cart";

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'mtg_export':
            (async () => {
                var data = ['N°;Quien pide;Nombre de la carta;Cantidad;Precio;Total;Condición 1;Condición 2;Link'];
                try {
                    let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                    var action;
                    switch(tab.url) {
                        case URL_MTGMINTCARD:
                            action = 'add_all_cards_mint';
                            break;
                        case URL_CARDKINGDOM:
                            action = 'add_all_cards_ck';
                            break;
                        default:
                            throw new Error("Unknown Site");
                    }
                    let response = await chrome.tabs.sendMessage(tab.id, {action: action});
                    let cards = response.cards;
                    var totalCount = 0;
                    var totalAmount = 0;
                    cards.forEach(card => {
                        let cardName = `${card.name}${card.material.length > 0 ? ` (${card.material})` : ""}`;
                        let total = card.count * card.price;
                        totalCount += card.count;
                        totalAmount += total;
                        let condition = card.condition.length > 0 ? card.condition : 'NM-M';
                        data.push(`;;${cardName};${card.count};${card.price};${total};${condition};${condition};${card.link}`);
                    });
                    data.push(`;;;${totalCount};;${totalAmount};;;`);
                } catch(error) {
                    console.error(`Add All Cards failed: ${error}`);
                }

                let isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
                var csvData;

                if (isFirefox) {
                    csvData = URL.createObjectURL(new Blob([data.join("\n")], { type: 'text/csv;charset=utf-8' }));
                } else {
                    csvData = 'data:text/csv;base64,' + bytesToBase64(new TextEncoder().encode(data.join("\n")));
                }

                try {
                    await chrome.downloads.download({
                        url: csvData,
                        filename: 'cards.csv',
                        saveAs: true
                    });
                } catch (error) {
                    console.error(`Download failed: ${error}`);
                } finally {
                    if (isFirefox) {
                        URL.revokeObjectURL(csvData);
                    }
                }
            })();
            break;
    }
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(
        {
            id: 'mtg_export',
            title: 'Export Cart', 
            contexts: ['page'],
            documentUrlPatterns: [URL_MTGMINTCARD, URL_CARDKINGDOM]
        },
        () => void chrome.runtime.lastError,
    );
});

function bytesToBase64(bytes) {
    let binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join('');
    return btoa(binString);
}
