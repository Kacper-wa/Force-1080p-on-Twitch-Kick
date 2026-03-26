// ==UserScript==
// @name         Force 1080p on Twitch & Kick
// @namespace    http://tampermonkey.net/
// @version      7.4
// @description  Auto-closes Twitch quality menu reliably (new 2026 UI) + quality drop watcher
// @match        *://*.twitch.tv/*
// @match        *://*.kick.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log("[Skrypt 1080p v7.4] Wstrzyknięto na: " + location.hostname);

    let attemptInterval;
    let watcherInterval;
    let attempts = 0;
    let canForce1080 = false;
    const MAX_ATTEMPTS = 25;

    // ==================== WSPÓLNE FUNKCJE ====================
    function findMainVideo() {
        const videos = Array.from(document.querySelectorAll('video'))
            .filter(v => v.offsetParent !== null && v.clientWidth * v.clientHeight > 0);
        videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight));
        return videos[0] || null;
    }

    function getCurrentResolution() {
        const video = findMainVideo() || document.querySelector('video');
        return video ? video.videoHeight : 0;
    }

    function simulateClick(el) {
        if (!el) return;
        el.focus();
        const events = ['pointerover', 'pointerenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(type => {
            el.dispatchEvent(new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                composed: true,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
                clientX: el.getBoundingClientRect().left + 5,
                clientY: el.getBoundingClientRect().top + 5
            }));
        });
    }

    // ==================== ZAMYKANIE MENU (ulepszone dla Twitcha) ====================
    function autoCloseMenu() {
        document.body.click();
        const vid = findMainVideo();
        if (vid) {
            const closeEvent = new MouseEvent('click', { bubbles: true });
            vid.dispatchEvent(closeEvent);
        }

        // === SPECJALNE ZAMYKANIE DLA TWITCHA (Twój screen) ===
        if (location.hostname.includes('twitch.tv')) {
            const settingsBtn = document.querySelector('[data-a-target="player-settings-button"]');
            if (settingsBtn) {
                settingsBtn.click(); // drugie kliknięcie w trybik = zamknięcie całego panelu
                console.log("[Skrypt 1080p v7.4] Twitch: Dodatkowe kliknięcie w trybik → menu zamknięte");
            }
        }

        console.log("[Skrypt 1080p v7.4] Menu zamknięte automatycznie");
    }

    // ==================== WATCHER – SPADANIE JAKOŚCI ====================
    function startQualityWatcher() {
        if (watcherInterval) clearInterval(watcherInterval);
        watcherInterval = setInterval(() => {
            const res = getCurrentResolution();
            if (res > 0 && res < 1080 && canForce1080) {
                console.log(`[Skrypt 1080p v7.4] Jakość spadła do ${res}p – wymuszam 1080p z powrotem!`);
                attempts = 0;
                if (location.hostname.includes('twitch.tv')) setQualityTwitch();
                else if (location.hostname.includes('kick.com')) setQualityKick();
            }
        }, 2000);
    }

    // ==================== TWITCH ====================
    function setQualityTwitch() {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            clearInterval(attemptInterval);
            return;
        }
        const settingsButton = document.querySelector('[data-a-target="player-settings-button"]');
        if (!settingsButton) return;

        settingsButton.click();

        setTimeout(() => {
            const menuItems = document.querySelectorAll('[role="menuitem"], [data-a-target="player-settings-menu-item-quality"]');
            const qualityMenu = Array.from(menuItems).find(el =>
                el.textContent.toLowerCase().includes('quality') ||
                el.textContent.toLowerCase().includes('jakość')
            );

            if (qualityMenu) {
                if (qualityMenu.textContent.includes('1080') && !qualityMenu.textContent.includes('Auto')) {
                    clearInterval(attemptInterval);
                    canForce1080 = true;
                    autoCloseMenu();
                    console.log("[Skrypt 1080p v7.4] Twitch: Już jest 1080p60!");
                    return;
                }

                qualityMenu.click();

                setTimeout(() => {
                    const options = Array.from(document.querySelectorAll('[role="menuitemradio"]'));
                    let target = options.find(el => el.textContent.includes('1080') && !el.textContent.toLowerCase().includes('auto'));

                    if (target) {
                        target.click();
                        clearInterval(attemptInterval);
                        canForce1080 = true;
                        console.log("[Skrypt 1080p v7.4] Twitch: Zmieniono na 1080p60 (Source)");
                        autoCloseMenu();   // ← teraz na pewno znika
                    } else {
                        autoCloseMenu();
                    }
                }, 350);
            } else {
                autoCloseMenu();
            }
        }, 300);
    }

    // ==================== KICK (bez zmian) ====================
    function wakeUpPlayer() {
        const video = document.querySelector('video');
        if (video) {
            const event = new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 });
            video.dispatchEvent(event);
            if (video.parentElement) video.parentElement.dispatchEvent(event);
        }
    }

    function looksLikeAvatar(btn) {
        if (btn.closest('header')) return true;
        if (btn.querySelector('img,[data-testid*="avatar" i]')) return true;
        const aria = (btn.getAttribute('aria-label') || "").toLowerCase();
        return /\b(profile|account|avatar|user)\b/.test(aria);
    }

    function findSettingsButton(video) {
        if (!video) return null;
        const vRect = video.getBoundingClientRect();

        const explicit = Array.from(document.querySelectorAll('button[aria-haspopup="menu"]'))
            .find(b => /settings/i.test(b.getAttribute('aria-label') || "") &&
                  (b.getBoundingClientRect().bottom > vRect.top && b.getBoundingClientRect().top < vRect.bottom));
        if (explicit) return explicit;

        const menuish = Array.from(document.querySelectorAll('button[aria-haspopup="menu"]'))
            .filter(b => !looksLikeAvatar(b) &&
                  (b.getBoundingClientRect().bottom > vRect.top && b.getBoundingClientRect().top < vRect.bottom));
        if (menuish.length) {
            menuish.sort((a, b) => {
                const ca = a.getBoundingClientRect();
                const cb = b.getBoundingClientRect();
                const da = Math.hypot(vRect.right - (ca.left + ca.width / 2), vRect.bottom - (ca.top + ca.height / 2));
                const db = Math.hypot(vRect.right - (cb.left + cb.width / 2), vRect.bottom - (cb.top + cb.height / 2));
                return da - db;
            });
            return menuish[0];
        }
        return null;
    }

    function pickQuality() {
        const items = Array.from(document.querySelectorAll('[role="menuitemradio"]'));
        if (!items.length) return false;

        const clean = t => t.trim().replace(/\s+/g, '').toLowerCase();

        let target = items.find(i => clean(i.textContent).includes('1080p60')) ||
                     items.find(i => clean(i.textContent).includes('1080p') && !clean(i.textContent).includes('auto'));

        if (target) {
            simulateClick(target);
            console.log("[Skrypt 1080p v7.4] Kick: Kliknięto 1080p60!");
            canForce1080 = true;
            return true;
        }

        const nonAuto = items.filter(i => !/auto/i.test(i.textContent));
        if (nonAuto.length) {
            simulateClick(nonAuto[nonAuto.length - 1]);
            console.log("[Skrypt 1080p v7.4] Kick: Fallback na najwyższą jakość");
            return true;
        }
        return false;
    }

    function setQualityKick() {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            clearInterval(attemptInterval);
            console.log("[Skrypt 1080p v7.4] Kick: Przekroczono limit prób");
            return;
        }

        wakeUpPlayer();

        const video = findMainVideo();
        if (!video) return;

        const settingsButton = findSettingsButton(video);
        if (!settingsButton) {
            if (attempts % 5 === 0) console.log(`[Skrypt 1080p v7.4] Kick: ${attempts}/25 - Czekam na trybik...`);
            return;
        }

        console.log("[Skrypt 1080p v7.4] Kick: Znalazłem trybik → otwieram menu");
        simulateClick(settingsButton);

        setTimeout(() => {
            const success = pickQuality();
            if (success) {
                clearInterval(attemptInterval);
                console.log("[Skrypt 1080p v7.4] Kick: SUKCES – 1080p ustawione!");
                setTimeout(autoCloseMenu, 180);
            } else {
                autoCloseMenu();
            }
        }, 350);
    }

    // ==================== INIT ====================
    function init() {
        console.log("[Skrypt 1080p v7.4] Uruchamiam...");
        attempts = 0;
        canForce1080 = false;
        clearInterval(attemptInterval);
        clearInterval(watcherInterval);

        setTimeout(() => {
            if (location.hostname.includes('twitch.tv')) {
                attemptInterval = setInterval(setQualityTwitch, 500);
            } else if (location.hostname.includes('kick.com')) {
                attemptInterval = setInterval(setQualityKick, 500);
            }
            startQualityWatcher();
        }, 700);
    }

    init();

    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log("[Skrypt 1080p v7.4] Zmiana kanału → reset");
            init();
        }
    }).observe(document, { subtree: true, childList: true });
})();
