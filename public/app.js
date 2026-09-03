const API_BASE = '';
let currentSources = [];
let currentSourceIndex = 0;

const views = {
    home: document.getElementById('home-view'),
    detail: document.getElementById('detail-view'),
    player: document.getElementById('player-view')
};

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const genreSelect = document.getElementById('genre-select');
const movieGrid = document.getElementById('movie-grid');
const sectionTitle = document.getElementById('section-title');
const navLinks = document.querySelectorAll('.nav-links a');

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    handleRouting();
});

function initEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (category) {
                window.location.hash = `#category/${category}`;
            } else {
                window.location.hash = '';
            }
        });
    });

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    genreSelect.addEventListener('change', (e) => {
        const genreId = e.target.value;
        if (genreId) {
            window.location.hash = `#genre/${genreId}`;
        } else {
            window.location.hash = '';
        }
    });

    window.addEventListener('hashchange', handleRouting);
}

async function handleRouting() {
    const hash = window.location.hash;

    if (hash.startsWith('#movie/')) {
        const id = hash.replace('#movie/', '');
        showView('detail');
        loadMovieDetail(id);
    } else if (hash.startsWith('#play/')) {
        const id = hash.replace('#play/', '');
        showView('player');
        loadPlayer(id);
    } else {
        showView('home');
        if (hash.startsWith('#category/')) {
            const cat = hash.replace('#category/', '');
            loadCategoryMovies(cat);
        } else if (hash.startsWith('#genre/')) {
            const genreId = hash.replace('#genre/', '');
            loadGenreMovies(genreId);
        } else if (hash.startsWith('#search/')) {
            const query = decodeURIComponent(hash.replace('#search/', ''));
            loadSearchResults(query);
        } else {
            loadHomeMovies();
        }
    }
}

function showView(viewName) {
    // Menghentikan video & suara, tapi tetap menyimpan posisi menit terakhir di browser
    if (viewName !== 'player' && views.player) {
        const iframe = views.player.querySelector('iframe');
        if (iframe) {
            iframe.src = '';
        }
    }

    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].style.display = key === viewName ? 'block' : 'none';
        }
    });
    window.scrollTo(0, 0);
}

async function loadHomeMovies() {
    sectionTitle.textContent = 'Rekomendasi Film';
    movieGrid.innerHTML = '<div class="loading">Memuat film...</div>';
    try {
        const res = await fetch(`${API_BASE}/api/movies/home`);
        const data = await res.json();
        renderMovieGrid(data.results);
    } catch (err) {
        movieGrid.innerHTML = '<div class="error">Gagal memuat film.</div>';
    }
}

async function loadCategoryMovies(category) {
    const titles = {
        'popular': 'Film Populer',
        'now-playing': 'Sedang Tayang',
        'top-rated': 'Rating Tinggi',
        'upcoming': 'Segera Tayang'
    };
    sectionTitle.textContent = titles[category] || 'Daftar Film';
    movieGrid.innerHTML = '<div class="loading">Memuat film...</div>';
    try {
        const res = await fetch(`${API_BASE}/api/movies/${category}`);
        const data = await res.json();
        renderMovieGrid(data.results);
    } catch (err) {
        movieGrid.innerHTML = '<div class="error">Gagal memuat kategori.</div>';
    }
}

async function loadGenreMovies(genreId) {
    const genreName = genreSelect.options[genreSelect.selectedIndex]?.text || 'Genre';
    sectionTitle.textContent = `Genre: ${genreName}`;
    movieGrid.innerHTML = '<div class="loading">Memuat film...</div>';
    try {
        const res = await fetch(`${API_BASE}/api/movies/discover?genre=${genreId}`);
        const data = await res.json();
        renderMovieGrid(data.results);
    } catch (err) {
        movieGrid.innerHTML = '<div class="error">Gagal memuat genre.</div>';
    }
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        window.location.hash = `#search/${encodeURIComponent(query)}`;
    }
}

async function loadSearchResults(query) {
    sectionTitle.textContent = `Hasil Pencarian: "${query}"`;
    movieGrid.innerHTML = '<div class="loading">Mencari film...</div>';
    try {
        const res = await fetch(`${API_BASE}/api/movies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderMovieGrid(data.results);
    } catch (err) {
        movieGrid.innerHTML = '<div class="error">Gagal mencari film.</div>';
    }
}

function renderMovieGrid(movies) {
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<div class="no-results">Film tidak ditemukan.</div>';
        return;
    }

    movieGrid.innerHTML = movies.map(movie => {
        const poster = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const year = movie.release_date ? movie.release_date.split('-')[0] : '';

        return `
            <div class="movie-card" onclick="location.hash='#movie/${movie.id}'">
                <div class="poster-wrapper">
                    <img src="${poster}" alt="${movie.title}" loading="lazy">
                    <span class="rating">★ ${rating}</span>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <span class="movie-year">${year}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function loadMovieDetail(id) {
    views.detail.innerHTML = '<div class="loading">Memuat detail film...</div>';
    try {
        const [detailRes, creditsRes] = await Promise.all([
            fetch(`${API_BASE}/api/movies/detail/${id}`),
            fetch(`${API_BASE}/api/movies/credits/${id}`)
        ]);

        const movie = await detailRes.json();
        const credits = await creditsRes.json();

        const backdrop = movie.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` 
            : '';
        const poster = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';

        const cast = credits.cast ? credits.cast.slice(0, 8).map(c => c.name).join(', ') : '-';
        const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : '-';

        views.detail.innerHTML = `
            <div class="detail-header" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.7), #121212), url('${backdrop}')">
                <button class="back-btn" onclick="history.back()">← Kembali</button>
                <div class="detail-content">
                    <img src="${poster}" alt="${movie.title}" class="detail-poster">
                    <div class="detail-info">
                        <h1>${movie.title}</h1>
                        <div class="meta">
                            <span>★ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                            <span>${movie.release_date?.split('-')[0] || ''}</span>
                            <span>${movie.runtime ? movie.runtime + ' Menit' : ''}</span>
                        </div>
                        <p class="genres"><strong>Genre:</strong> ${genres}</p>
                        <p class="overview">${movie.overview || 'Deskripsi tidak tersedia.'}</p>
                        <p class="cast"><strong>Pemeran:</strong> ${cast}</p>
                        
                        <button class="play-btn" onclick="location.hash='#play/${movie.id}'">
                            ▶ Tonton Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        views.detail.innerHTML = '<div class="error">Gagal memuat detail film.</div>';
    }
}

async function loadPlayer(id) {
    views.player.innerHTML = '<div class="loading">Memuat player...</div>';
    try {
        const [playRes, detailRes] = await Promise.all([
            fetch(`${API_BASE}/api/movies/play/${id}`),
            fetch(`${API_BASE}/api/movies/detail/${id}`)
        ]);

        const playData = await playRes.json();
        const movie = await detailRes.json();

        currentSources = playData.sources || [];
        currentSourceIndex = 0;

        renderPlayerUI(movie);
    } catch (err) {
        views.player.innerHTML = '<div class="error">Gagal memuat pemutar video.</div>';
    }
}

function renderPlayerUI(movie) {
    if (!currentSources.length) {
        views.player.innerHTML = '<div class="error">Server tidak tersedia.</div>';
        return;
    }

    const currentSource = currentSources[currentSourceIndex];

    const serverButtons = currentSources.map((src, idx) => `
        <button class="server-btn ${idx === currentSourceIndex ? 'active' : ''}" 
                onclick="changeServer(${idx})">
            ${src.label}
        </button>
    `).join('');

    views.player.innerHTML = `
        <div class="player-container">
            <button class="back-btn" onclick="location.hash='#movie/${movie.id}'">← Kembali ke Detail</button>
            <h2>${movie.title}</h2>
            
            <div class="iframe-wrapper">
                <iframe src="${currentSource.url}" 
                        allowfullscreen 
                        frameborder="0" 
                        scrolling="no"
                        allow="autoplay; encrypted-media">
                </iframe>
            </div>

            <div class="server-selector">
                <h3>Pilih Server (Ganti jika pemutar error/blank):</h3>
                <div class="server-list">
                    ${serverButtons}
                </div>
            </div>
        </div>
    `;
}

function changeServer(index) {
    currentSourceIndex = index;
    const iframe = document.querySelector('.iframe-wrapper iframe');
    if (iframe) {
        iframe.src = currentSources[index].url;
    }
    
    document.querySelectorAll('.server-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === index);
    });
}
