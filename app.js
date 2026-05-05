const SUPABASE_URL = 'https://fhrwjrktvwfrpxrxzplo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocndqcmt0dndmcnB4cnh6cGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA2MDcsImV4cCI6MjA5MTczNjYwN30.ZxvK9OAPQaZ3-Qvwm9HgRgx44h-_tT5iHiRhj6GoNmI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tournaments = [];

$(document).ready(async function() {
    checkAndRedirectInAppBrowser();
    injectMobileUXStyles();

    await fetchTournaments();
    setupSearch();
});

function checkAndRedirectInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const inAppRegex = /(FB_IAB|FB4A|FBAN|FBAV|IG_CPA|Instagram|Zalo|Discord|Line|TikTok|Snapchat)/i;

    if (inAppRegex.test(ua)) {
        const targetUrl = 'https://minhbruh-minhbip.github.io/Stick-War-Saga-Vietnam-Tournaments/';
        
        const overlay = $(`
            <div id="inapp-warning" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #313338; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 20px; box-sizing: border-box;">
                <div style="background: rgba(218, 55, 60, 0.2); padding: 15px; border-radius: 50%; margin-bottom: 20px;">
                    <span style="font-size: 40px;">⚠️</span>
                </div>
                <h2 style="color: #DA373C; margin-bottom: 15px; font-size: 24px;">The browser is not optimized.!</h2>
                <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5; color: #B5BAC1;">
                    You are opening the website inside an app (Zalo/Facebook/Discord...).<br>
                    To ensure the website runs as smoothly as possible, the system will open it in the native browser (Chrome/Safari).
                </p>
                <div style="font-size: 60px; font-weight: bold; color: #5865F2; margin-bottom: 20px;" id="countdown">5</div>
                <p style="font-size: 14px; color: #888; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
                    💡 Tip: If the phone doesn't switch automatically, please tap <b>the three dots (⋮)</b> or <b>arrow icon</b>in the corner of the screen and select <br><b>"Mở bằng trình duyệt" (Open in Browser)</b>.
                </p>
            </div>
        `);
        $('body').append(overlay);

        let timeLeft = 5;
        const timer = setInterval(() => {
            timeLeft--;
            $('#countdown').text(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timer);
                
                if (/android/i.test(ua)) {
                    window.location.href = "intent://minhbruh-minhbip.github.io/Stick-War-Saga-Vietnam-Tournaments/#Intent;scheme=https;package=com.android.chrome;end";
                } else {
                    window.location.href = targetUrl; 
                }
            }
        }, 1000);
    }
}

function injectMobileUXStyles() {
    if ($('#mobile-ux-styles').length === 0) {
        $('head').append(`
            <style id="mobile-ux-styles">
                #viewer-bracket, .group-container {
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                }
                
                ::-webkit-scrollbar { height: 6px; width: 6px; }
                ::-webkit-scrollbar-thumb { background: #5865F2; border-radius: 10px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }

                @media (max-width: 768px) {
                    header { flex-direction: column; gap: 15px; padding: 15px !important; text-align: center; }
                    header h1 { font-size: 20px !important; }
                    header div { width: 100%; display: flex; flex-direction: column; gap: 10px; }
                    #searchInput { width: 100% !important; box-sizing: border-box; }
                    .btn, .main-tab-btn, .sub-tab-btn { padding: 12px 15px !important; font-size: 14px !important; }
                    .main-tabs, .sub-tabs { 
                        flex-wrap: nowrap !important; 
                        overflow-x: auto; 
                        white-space: nowrap; 
                        padding-bottom: 5px; 
                        justify-content: flex-start !important;
                    }
                    .card { padding: 12px !important; margin-bottom: 10px !important; }
                    .card-title { font-size: 16px !important; }
                    .card-info { flex-direction: column; gap: 5px; font-size: 12px !important; }
                    #tab-gamers > div { grid-template-columns: 1fr !important; }
                    .jQBracket .team { padding: 6px !important; }
                    .jQBracket .score { font-size: 14px !important; padding: 6px !important; }
                    .sb-header-mobile-fix {
                        flex-direction: column !important;
                        gap: 10px !important;
                        padding: 15px !important;
                    }
                    .sb-header-mobile-fix > div { width: 100% !important; text-align: center !important; }
                }
            </style>
        `);
    }
}

async function fetchTournaments() {
    const { data, error } = await supabaseClient.from('tournaments').select('*').order('start_date', { ascending: false });
    if (error) {
        console.error("Error fetching data:", error);
    } else {
        tournaments = data;
        renderTournaments(tournaments);
    }
}

function renderTournaments(data) {
    $('#current-tournaments').empty();
    $('#upcoming-tournaments').empty();
    $('#history-tournaments').empty();

    data.forEach(t => {
        const isLive = t.status === 'live';
        const isUpcoming = t.status === 'upcoming';
        const liveBadge = isLive ? `<span class="badge-live">LIVE</span>` : '';
        const upcomingBadge = isUpcoming ? `<span class="badge-upcoming">Upcoming</span>` : '';
        const html = `
            <div class="card" onclick="viewTournament(${t.id})">
                <div class="card-title">${t.name} ${liveBadge} ${upcomingBadge}</div>
                <div class="card-info">
                    🕒 ${t.start_date || '?'} - ${t.end_date || '?'} | 👑 Host: ${t.host || 'Trống'}
                </div>
            </div>
        `;
        if (isLive) {
            $('#current-tournaments').append(html);
        } else if (isUpcoming) {
            $('#upcoming-tournaments').append(html);
        } else {
            $('#history-tournaments').append(html);
        }
    });
}

function setupSearch() {
    $('#searchInput').on('input', function() {
        const val = $(this).val().toLowerCase();
        const filtered = tournaments.filter(t => t.name.toLowerCase().includes(val) || (t.host && t.host.toLowerCase().includes(val)));
        renderTournaments(filtered);
    });
}

function viewTournament(id) {
    const t = tournaments.find(x => x.id == id);
    if (!t) return;

    $('#det-name').text(t.name);
    $('#det-date').text(`${t.start_date || '?'} tới ${t.end_date || '?'}`);
    $('#det-host').text(t.host || 'Trống');
    $('#det-sponsor').text(t.sponsor || 'Trống');
    $('#det-version').text(t.version || 'Trống');

    let stagesData = [];
    if (t.formats && t.formats.trim() !== "") {
        try { stagesData = JSON.parse(t.formats); } 
        catch (e) { console.error("Error parsing tournament stages data:", e); }
    }

    let gamersData = [];
    if (t.gamer && t.gamer.trim() !== "") {
        try { gamersData = JSON.parse(t.gamer); } 
        catch (e) { console.error("Error parsing player data:", e); }
    }

    renderViewerResults(stagesData);
    renderViewerGamers(gamersData);

    $('#main-page').addClass('hidden');
    $('#details-page').removeClass('hidden');
    
    switchTab('results');
}

function renderViewerGamers(gamers) {
    const container = $('#tab-gamers');
    container.empty();

    if (!gamers || gamers.length === 0) {
        container.append(`
            <div class="card" style="cursor: default;">
                <p style="color: var(--text-muted); text-align: center;">Chưa có thông tin tuyển thủ cho giải đấu này.</p>
            </div>
        `);
        return;
    }

    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">`;
    
    gamers.forEach(g => {
        html += `
            <div class="card" style="border-left: 4px solid var(--accent); cursor: default; padding: 15px;">
                <div style="font-weight: bold; font-size: 18px; color: var(--text-main);">${g.name}</div>
                <div style="font-size: 14px; color: var(--text-muted); margin-top: 5px;">🎮 ${g.desc || 'Đang cập nhật'}</div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.append(html);
}

function renderViewerResults(stages) {
    const container = $('#tab-results');
    container.empty();

    if (!stages || stages.length === 0) {
        container.append('<p style="color: var(--text-muted); text-align: center; padding: 20px;">Giải đấu này chưa cập nhật kết quả thi đấu.</p>');
        return;
    }

    window.viewerStagesData = stages; 

    let tabsHtml = `<div class="sub-tabs">`;
    stages.forEach((stage, index) => {
        const active = index === 0 ? 'active' : '';
        tabsHtml += `<button class="sub-tab-btn ${active}" onclick="openViewerStage(${index})">${stage.name}</button>`;
    });
    tabsHtml += `</div><div id="viewer-stage-content"></div>`;
    
    container.append(tabsHtml);
    openViewerStage(0); 
}

window.openViewerStage = function(index) {
    $('.sub-tab-btn').removeClass('active');
    $('.sub-tab-btn').eq(index).addClass('active');

    const stage = window.viewerStagesData[index];
    const contentBox = $('#viewer-stage-content');
    contentBox.empty();

    let stageTabsHtml = `
        <div class="main-tabs" style="margin-top: 15px;">
            <button class="main-tab-btn active" id="btn-viewer-details" onclick="switchViewerStageTab('details')">Details</button>
            <button class="main-tab-btn" id="btn-viewer-replay" onclick="switchViewerStageTab('replay')">Replay links</button>
        </div>
        <div id="viewer-sub-details"></div>
        <div id="viewer-sub-replay" class="hidden"></div>
    `;
    contentBox.append(stageTabsHtml);

    const detailsBox = $('#viewer-sub-details');
    const replayBox = $('#viewer-sub-replay');

    if (stage.format.includes('Elimination')) {
        detailsBox.append(`<div id="viewer-bracket" style="overflow-x: auto; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius);"></div>`);
        
        let bracketData = stage.data || { teams:[["--", "--"]], results: [[[[null, null]]]] };

        let maxCharLength = 10;
        if (bracketData.teams) {
            bracketData.teams.forEach(match => {
                match.forEach(teamName => {
                    if (teamName && teamName.length > maxCharLength) {
                        maxCharLength = teamName.length;
                    }
                });
            });
        }
        let dynamicTeamWidth = Math.max(120, maxCharLength * 8 + 40); 
        if ($('#custom-bracket-style').length === 0) {
            $('head').append(`
                <style id="custom-bracket-style">
                    .jQBracket .team.win .label,
                    .jQBracket .team.win .score {
                        color: #ffffff !important;
                        font-weight: bold !important;
                        text-shadow: 0 0 4px rgba(255,255,255,0.2);
                    }
                    .jQBracket .team.lose .label,
                    .jQBracket .team.lose .score {
                        color: #ff5601 !important;
                    }
                </style>
            `);
        }

        $('#viewer-bracket').bracket({
            init: bracketData,
            theme: 'dark',
            teamWidth: dynamicTeamWidth
        });

    } 
    // === CẬP NHẬT TẠI ĐÂY: BẢNG GROUP STAGE FLEXBOX / WORD-BREAK CHO VIEWER ===
    else if (stage.format === 'Group Stage') {
        let groupsHtml = `<h3 style="margin-bottom: 15px; color: var(--text-main);">Kết quả ${stage.name}</h3>`;

        if (!stage.data || stage.data.length === 0) {
            detailsBox.append(groupsHtml + "<p style='color: var(--text-muted);'>Chưa có dữ liệu bảng đấu.</p>");
        } else {
            stage.data.forEach(group => {
                groupsHtml += `
                <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--accent); cursor: default; padding: 20px;">
                    <h3 style="color: var(--accent); margin-bottom: 15px; margin-top: 0;">${group.name}</h3>
                    
                    <div class="group-container" style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
                        
                        <!-- Cột Trái: Bảng Xếp Hạng -->
                        <div style="flex: 1 1 45%; min-width: 320px; overflow-x: auto;">
                            <table class="custom-table" style="width: 100%; word-break: break-word;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left;">Team</th>
                                        <th style="width: 50px; text-align: center;">W</th>
                                        <th style="width: 50px; text-align: center;">L</th>
                                        <th style="width: 50px; text-align: center;">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
                let sortedTeams = group.teams.sort((a, b) => b.pts - a.pts);
                sortedTeams.forEach(team => {
                    groupsHtml += `
                                    <tr>
                                        <td style="font-weight: bold; word-break: break-word;">${team.name}</td>
                                        <td style="text-align: center;">${team.w}</td>
                                        <td style="text-align: center;">${team.l}</td>
                                        <td style="text-align: center;"><strong style="color: var(--accent);">${team.pts}</strong></td>
                                    </tr>`;
                });

                groupsHtml += `
                                </tbody>
                            </table>
                        </div>

                        <!-- Cột Phải: Lịch Thi Đấu -->
                        <div class="match-list" style="flex: 1 1 45%; min-width: 320px; background: rgba(0,0,0,0.15); padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 15px 0;">History Matches</h4>
                            <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">`;
                
                if (group.matches && group.matches.length > 0) {
                    group.matches.forEach(match => {
                        groupsHtml += `
                                <div class="match-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 8px; margin-bottom: 5px; border-radius: 4px;">
                                    <span class="match-team" style="flex: 1; text-align: right; word-break: break-word; font-size: 13px;">${match.team1}</span>
                                    <span class="match-score" style="margin: 0 15px; font-weight: bold; color: var(--accent); font-size: 14px; min-width: 40px; text-align: center;">${match.score1} - ${match.score2}</span>
                                    <span class="match-team" style="flex: 1; text-align: left; word-break: break-word; font-size: 13px;">${match.team2}</span>
                                </div>`;
                    });
                } else {
                    groupsHtml += `<p style="font-size: 13px; color: var(--text-muted); margin: 0;">Chưa có trận đấu nào diễn ra.</p>`;
                }

                groupsHtml += `
                            </div>
                        </div>

                    </div>
                </div>`;
            });

            detailsBox.append(groupsHtml);
        }
    }

    if (!stage.replays || stage.replays.length === 0) {
        replayBox.append('<p style="color: var(--text-muted); text-align: center; padding: 20px;">Chưa có video replay nào cho vòng đấu này.</p>');
    } else {
        let replaysHtml = `<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">`;
        
        stage.replays.forEach(match => {
            let gamesHtml = '';
            if (match.games && match.games.length > 0) {
                match.games.forEach((link, idx) => {
                    let safeLink = link ? link.replace(/"/g, '&quot;').replace(/'/g, "\\'") : '';
                    gamesHtml += `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #333;">
                            <span style="font-size: 13px; color: var(--text-muted); width: 60px; font-weight: bold;">Match ${idx + 1}:</span>
                            <input type="text" value="${safeLink}" readonly style="flex: 1; background: transparent; border: none; color: #5865F2; text-decoration: underline; font-size: 13px; outline: none; cursor: text;">
                            <button class="btn" style="background: #4752c4; color: white; padding: 4px 12px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; transition: 0.2s;" onclick="copyReplayLink('${safeLink}', this)">Copy Link</button>
                        </div>
                    `;
                });
            } else {
                gamesHtml = `<p style="font-size: 13px; color: var(--text-muted); text-align: center; margin: 0;">Đang cập nhật link replay...</p>`;
            }

            replaysHtml += `
                <div style="background: var(--bg-tertiary); border: 1px solid var(--bg-secondary); border-radius: var(--radius-sm); overflow: hidden; cursor: default;">
                    <div class="sb-header-mobile-fix" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); padding: 12px; border-bottom: 2px solid var(--accent); gap: 15px;">
                        <div style="flex: 1; text-align: right; font-weight: bold; font-size: 16px; color: var(--text-main);">${match.team1 || 'Player 1'}</div>
                        <div style="background: var(--bg-secondary); border: 1px solid #444; color: var(--accent); font-weight: bold; font-size: 20px; padding: 5px 15px; border-radius: 4px; text-align: center; min-width: 80px;">
                            ${match.score1 || 0} - ${match.score2 || 0}
                        </div>
                        <div style="flex: 1; text-align: left; font-weight: bold; font-size: 16px; color: var(--text-main);">${match.team2 || 'Player 2'}</div>
                    </div>
                    <div style="padding: 10px 15px; background: rgba(0,0,0,0.1);">
                        ${gamesHtml}
                    </div>
                </div>
            `;
        });
        
        replaysHtml += `</div>`;
        replayBox.append(replaysHtml);
    }
}

window.copyReplayLink = function(link, btnElement) {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
        const originalText = $(btnElement).text();
        $(btnElement).text('Copied!').css('background-color', '#2ecc71');
        setTimeout(() => {
            $(btnElement).text(originalText).css('background-color', '#4752c4');
        }, 2000);
    }).catch(err => {
        console.error('Could not copy', err);
    });
}

window.switchViewerStageTab = function(tabName) {
    $('#btn-viewer-details, #btn-viewer-replay').removeClass('active');
    $('#viewer-sub-details, #viewer-sub-replay').addClass('hidden');
    
    if(tabName === 'details') {
        $('#btn-viewer-details').addClass('active');
        $('#viewer-sub-details').removeClass('hidden');
    } else {
        $('#btn-viewer-replay').addClass('active');
        $('#viewer-sub-replay').removeClass('hidden');
    }
}

function goBack() {
    $('#details-page').addClass('hidden');
    $('#main-page').removeClass('hidden');
}

function switchTab(tabId) {
    $('.tab-btn').removeClass('active');
    $('.tab-content').removeClass('active');

    $(`button[onclick="switchTab('${tabId}')"]`).addClass('active');
    $(`#tab-${tabId}`).addClass('active');
}
