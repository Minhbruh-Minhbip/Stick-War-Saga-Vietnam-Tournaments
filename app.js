const SUPABASE_URL = 'https://fhrwjrktvwfrpxrxzplo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocndqcmt0dndmcnB4cnh6cGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA2MDcsImV4cCI6MjA5MTczNjYwN30.ZxvK9OAPQaZ3-Qvwm9HgRgx44h-_tT5iHiRhj6GoNmI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tournaments =[];

$(document).ready(async function() {
    await fetchTournaments();
    setupSearch();
});

async function fetchTournaments() {
    const { data, error } = await supabaseClient.from('tournaments').select('*').order('start_date', { ascending: false });
    if (error) {
        console.error("Lỗi tải dữ liệu:", error);
    } else {
        tournaments = data;
        renderTournaments(tournaments);
    }
}

function renderTournaments(data) {
    $('#current-tournaments').empty();
    $('#history-tournaments').empty();

    data.forEach(t => {
        const isLive = t.status === 'live';
        const liveBadge = isLive ? `<span class="badge-live">LIVE</span>` : '';
        const html = `
            <div class="card" onclick="viewTournament(${t.id})">
                <div class="card-title">${t.name} ${liveBadge}</div>
                <div class="card-info">
                    🕒 ${t.start_date || '?'} - ${t.end_date || '?'} | 👑 Host: ${t.host || 'Trống'}
                </div>
            </div>
        `;
        if (isLive) {
            $('#current-tournaments').append(html);
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

    let stagesData =[];
    if (t.formats && t.formats.trim() !== "") {
        try { stagesData = JSON.parse(t.formats); } 
        catch (e) { console.error("Lỗi phân tích dữ liệu vòng đấu:", e); }
    }

    let gamersData =[];
    if (t.gamer && t.gamer.trim() !== "") {
        try { gamersData = JSON.parse(t.gamer); } 
        catch (e) { console.error("Lỗi phân tích dữ liệu gamer:", e); }
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

    if (stage.format.includes('Elimination')) {
        contentBox.append(`<div id="viewer-bracket" style="overflow-x: auto; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius);"></div>`);
        
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
    else if (stage.format === 'Group Stage') {
        let groupsHtml = `<h3 style="margin-bottom: 15px; color: var(--text-main);">Kết quả ${stage.name}</h3>`;

        if (!stage.data || stage.data.length === 0) {
            contentBox.append(groupsHtml + "<p style='color: var(--text-muted);'>Chưa có dữ liệu bảng đấu.</p>");
            return;
        }

        stage.data.forEach(group => {
            groupsHtml += `
            <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--accent); cursor: default;">
                <h3 style="color: var(--accent); margin-bottom: 10px;">${group.name}</h3>
                <div class="group-container">
                    <table class="custom-table">
                        <thead><tr><th>Team</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
                        <tbody>`;
            
            let sortedTeams = group.teams.sort((a, b) => b.pts - a.pts);
            sortedTeams.forEach(team => {
                groupsHtml += `<tr><td><strong>${team.name}</strong></td><td>${team.w}</td><td>${team.l}</td><td><strong style="color: var(--accent);">${team.pts}</strong></td></tr>`;
            });

            groupsHtml += `</tbody></table>
                    <div class="match-list">
                        <h4 style="margin-bottom: 10px;">Lịch sử đối đầu</h4>`;
            
            if (group.matches && group.matches.length > 0) {
                group.matches.forEach(match => {
                    groupsHtml += `<div class="match-row"><span class="match-team">${match.team1}</span><span class="match-score">${match.score1} - ${match.score2}</span><span class="match-team">${match.team2}</span></div>`;
                });
            } else {
                groupsHtml += `<p style="font-size: 13px; color: var(--text-muted);">Chưa có trận đấu nào diễn ra.</p>`;
            }

            groupsHtml += `</div></div></div>`;
        });

        contentBox.append(groupsHtml);
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