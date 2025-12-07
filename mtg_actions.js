const URL_MTGMINTCARD = "https://www.mtgmintcard.com/shopping-cart";
const URL_CARDKINGDOM = "https://www.cardkingdom.com/cart";

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId.startsWith('mtg_export_')) {
        (async () => {
            let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            var action;
            switch (tab.url) {
                case URL_MTGMINTCARD:
                    action = 'add_all_cards_mint';
                    break;
                case URL_CARDKINGDOM:
                    action = 'add_all_cards_ck';
                    break;
                default:
                    throw new Error("Unknown Site");
            }
            let cardsResponse = await chrome.tabs.sendMessage(tab.id, { action: action });

            switch (info.menuItemId) {
                case 'mtg_export_xslx':
                    chrome.tabs.sendMessage(tab.id, { action: 'export_cards_xlsx', data: cardsResponse.cards });
                    break;
                case 'mtg_export_csv':
                    let exportResponse = await chrome.tabs.sendMessage(tab.id, { action: 'export_cards_csv', data: cardsResponse.cards });
                    var csvData;
                    let isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

                    if (isFirefox) {
                        csvData = URL.createObjectURL(new Blob([exportResponse.data], { type: 'text/csv;charset=utf-8' }));
                    } else {
                        csvData = 'data:text/csv;base64,' + bytesToBase64(new TextEncoder().encode(exportResponse.data));
                    }

                    try {
                        await chrome.downloads.download({
                            url: csvData,
                            filename: 'cards.csv'
                        });
                    } catch (error) {
                        console.error(`Download failed: ${error}`);
                    } finally {
                        if (isFirefox) {
                            URL.revokeObjectURL(csvData);
                        }
                    }

                    break;
            }
        })();
    }
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(
        {
            id: 'mtg_export_xslx',
            title: 'Export Cart (Excel)',
            contexts: ['page'],
            documentUrlPatterns: [URL_MTGMINTCARD, URL_CARDKINGDOM]
        },
        () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
        {
            id: 'mtg_export_csv',
            title: 'Export Cart (CSV)',
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
