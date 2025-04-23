/**
 * games.js - Games list functionality for Void Network
 * Contains game listing and search functionality
 * Leaderboard functionality moved to leaderboard.js
 */

// Game data
const defaultApps = [
    {
        title: "Ball Dropper",
        imgSrc: "https://lh7-us.googleusercontent.com/CUj18dKaBkXv0WI59qpP2-Ub1J0KHyKXwgnhPBdmzDzwhQNvIkwPsrVLJCiSsS0iNOaF8-nAamakuiFLoRzYIGyOr-LOFJg9hD5IA9cIvjh5ZIHmBhT-hel39crAOTgz88P8jX2WApcC5PDnLbabDK_QC1vyFw",
        link: "/local games/Plinko/plinko.html"
    },
    {
        title: "MineFeild",
        imgSrc: "https://lh7-us.googleusercontent.com/WAjTfpxFqdXwMOlzyChcCi40sg6-ukZN5u24gdmWyi9_Yca5-V8vBR6zrgOoADGwKKJM7e7cKEkq9i_chkYesJvN_VVnvKAfUOPIllTxR2mbOK-HiR0vlIgH_2_bY2Oqzh2ndVieVycQoGDMXuZC-8gpE85Ypg",
        link: "/local games/CrossyRoad/crossy.html"
    },
    {
        title: "Memory Squares",
        imgSrc: "https://lh7-us.googleusercontent.com/USI3iEwtHyyyN6fdMllkREQg8h8N7xsXxw94Wb0umSNOzvXTgMtBtxMBXwgyVOHirbrZCVGU1JDeyVaW94xuTS-4vEvT1iZzriw3We_RIYDPW63aWxDEj8xZ_d7Nc3vi6LfrEr20QOOMvnWL8JD5XgbbC-PjKA",
        link: "/local games/memory-square/mem.html"
    },
    {
        title: "VoidSnake",
        imgSrc: "https://lh7-us.googleusercontent.com/zPbDytQWYmY90BK7jPcdb8QQ8QNz4LWyhwUq1zNWiD64NNGC_8L21T_QDOl9z8R9QRvJtkFRvM9f83ODmjJJYgG6sZwi71SPiTUwASMOaofbb7wIOKEQJ-Wq1VSGVlCg3RmSdC7B4d-SGOfs_hRdmKjtxHbGOQ",
        link: "/local games/Void Snake/Voidsnake.html"
    },
    {
        title: "Heads Or Tails?",
        imgSrc: "https://lh7-us.googleusercontent.com/jpunH9P0O_of8oU2ZilkliydM46qFTQxD__XgzIKv3OU7zZi77arrF9F2hGe-wgyzO5-57VJvN1zocVFN8549jIDkN2rKc9xEjcywhhJCldCaJkZnMgyEHtwJPuUsZZSu4DsK-L2b2eQGepfKwhgn4p7tgzrqA",
        link: "/local games/CoinFlip/coinflip.html"
    },
    {
        title: "Chicken Run",
        imgSrc: "https://lh7-us.googleusercontent.com/JugrfbksXzV3Mwwp32MOX-DHGD1EQJmZIaB_RYn9VBvoihT7-bClXPzyfYJC4mGXsYsdTMWJh-Xxe8L9wpHrGntuc0Shzu9tqKCTSug-jM2SiW1BIBcok9Fxlz0JvZEqaKVMbSWK1dlWmw8caafDFRErSox7YA",
        link: "/local games/ChickenRun/chickenrun.html"
    },
    {
        title: "Black Jack",
        imgSrc: "https://lh7-us.googleusercontent.com/OZqPInsN8s8qb43B5XLKVNm6uHmFM_GBSMVdBcr4Y8fYr-dX_jSqsu7keD7RoMafKFhUprNXkYYwpvmTwsNNkvmzR23M3XL1ykIp-8EpICFqttainlnXyRuobeBcEp4YE8fxhdDdBxgufc8EhjzItiMSAI821w",
        link: "/local games/BlackJack/BlackJack.html"
    },
    {
        title: "Tic Tac Toe",
        imgSrc: "https://lh7-us.googleusercontent.com/9kSWLTVDFONfAKr5ypIjt5LvF36mUlapDOEMJdwX0jkF-wvLUAPvd6Pg42ws-2Fdq2dRvOtO3WRMOtkJiS7atfoqugRCHgAsxqni6PVbRlIoM-uqCAOWjVp-wCnFWxuHDWAPEGuwjNkiBYSXhTljpVMf4A_h2Q",
        link: "/local games/TicTacToe/TicTacToe.html"
    },
    {
        title: "Water Roulette",
        imgSrc: "https://lh7-us.googleusercontent.com/55Ss_gX74t5Qy9Zr2OevrdodZtTs3lQ4KEAXiOhyMoRctF1EDDcaepxmc2Fou29Jl0AUWsl5NGx8xiDW89aOwgXnTtkrFa5B7TXOczHrtCbdyT8WFcrCcisyTUmd9h8XfGTmvbUZ2uXNZ8gZk7UoVMxuTh2tQw",
        link: "/local games/RussianRoulette/RussianRoulette.html"
    },
    {
        title: "Click Race Multiplayer",
        imgSrc: "https://lh7-us.googleusercontent.com/0uIu5df5JmX-mNMQCWXZU39v4N0h3tYQntJyUgd74z_OBw5neJum7hYw7YroKxDZI4lqaEZi66aTB3PuKtJ2-DdaPqf9ZhyzVrMkBaHuFTlITvL3dBLWVqpFBRKWr9lapTsOrbZMhjlf6MyKa3mcou5hO3zl5g",
        link: "/local games/ClickRace/ClickRace.html"
    },
];

/**
 * Game functions
 */

// Render the games list
function renderAppsList() {
    const gamesList = document.getElementById("gamesList");
    
    if (!gamesList) {
        console.error("Games list element not found");
        return;
    }
    
    gamesList.innerHTML = '';
    console.log("Rendering games list");
    
    defaultApps.forEach(app => {
        const appElement = document.createElement("div");
        appElement.className = "game-item";
        
        appElement.innerHTML = `
            <div class="game-icon">
                <img src="${app.imgSrc}" alt="${app.title} icon">
            </div>
            <h3 class="game-title">${app.title}</h3>
        `;

        appElement.onclick = () => {
            // Check if user is logged in before navigating to game
            const currentUser = window.voidAccounting.getCurrentUser();
            if (currentUser) {
                console.log("Navigating to game:", app.title);
                
                // Record the game play attempt
                window.voidAccounting.recordGameTransaction(
                    app.title.toLowerCase().replace(/\s+/g, '_'), 
                    currentUser.uid,
                    'game_play',
                    0 // Just tracking the visit, not charging coins here
                ).then(() => {
                    // Navigate to the game after transaction is recorded
                    window.location.href = app.link;
                }).catch(error => {
                    console.error("Error recording game visit:", error);
                    // Still navigate even if tracking fails
                    window.location.href = app.link;
                });
            } else {
                window.showNotification('Please login to play games', 'error');
                
                const authContainer = document.getElementById('auth-container');
                if (authContainer) {
                    authContainer.style.display = 'block';
                    setTimeout(() => {
                        authContainer.classList.add('visible');
                    }, 10);
                }
            }
        };

        gamesList.appendChild(appElement);
    });
}

// Search functionality for games
document.addEventListener('DOMContentLoaded', function() {
    const searchApps = document.getElementById("searchApps");
    if (searchApps) {
        searchApps.addEventListener("keyup", function() {
            const gamesList = document.getElementById("gamesList");
            const searchTerm = this.value.toLowerCase();
            
            if (!gamesList) return;
            
            gamesList.innerHTML = '';
            
            // Filter and render matching games
            defaultApps.forEach(app => {
                if (app.title.toLowerCase().includes(searchTerm)) {
                    const appElement = document.createElement("div");
                    appElement.className = "game-item";
                    
                    appElement.innerHTML = `
                        <div class="game-icon">
                            <img src="${app.imgSrc}" alt="${app.title} icon">
                        </div>
                        <h3 class="game-title">${app.title}</h3>
                    `;

                    appElement.onclick = () => {
                        // Check if user is logged in before navigating to game
                        const currentUser = window.voidAccounting.getCurrentUser();
                        if (currentUser) {
                            // Record the game play attempt
                            window.voidAccounting.recordGameTransaction(
                                app.title.toLowerCase().replace(/\s+/g, '_'), 
                                currentUser.uid,
                                'game_play',
                                0 // Just tracking the visit, not charging coins here
                            ).then(() => {
                                // Navigate to the game after transaction is recorded
                                window.location.href = app.link;
                            }).catch(error => {
                                console.error("Error recording game visit:", error);
                                // Still navigate even if tracking fails
                                window.location.href = app.link;
                            });
                        } else {
                            window.showNotification('Please login to play games', 'error');
                            const authContainer = document.getElementById('auth-container');
                            if (authContainer) {
                                authContainer.style.display = 'block';
                                setTimeout(() => {
                                    authContainer.classList.add('visible');
                                }, 10);
                            }
                        }
                    };

                    gamesList.appendChild(appElement);
                }
            });
        });
    }
});

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    // Render game list
    renderAppsList();
    
    // We don't initialize the leaderboard here anymore - it's in leaderboard.js
    
    // Dispatch event that games system is ready
    document.dispatchEvent(new CustomEvent('games-ready'));
    
    console.log("Games system initialized");
});

// Added event listener for when the core is ready
document.addEventListener('core-ready', function() {
    // Call any functions that depend on core being ready
    console.log("Core ready event received in games.js");
});

console.log('Games system loaded');
