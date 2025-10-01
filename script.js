/**
 * --------------------------------
 * 전역 상수 및 변수 선언
 * --------------------------------
 */
const API_ACCESS_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjYjkwN2I4NTcyNGVlZGI5YjI4NWY0MWU0Y2U3YjYzZiIsIm5iZiI6MTc1OTE5MTUyMC4zMjUsInN1YiI6IjY4ZGIyMWUwMzRkNTM1MTNhMTM4YzUyMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.eAtOrEXZ15JcdwAaPeuxt57zTsPmE__UPAPUGEsnDZY'; // 본인의 Access Token
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: API_ACCESS_TOKEN
    }
};

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const movieListDiv = document.getElementById('movie-list');
const filterButtons = document.querySelector('.filter-buttons'); 
const showLikedBtn = document.getElementById('show-liked-btn');
const loadMoreBtn = document.getElementById('load-more-btn');

let currentPage = 1;
let isLoading = false;

/**
 * --------------------------------
 * 핵심 기능 함수
 * --------------------------------
 */

// 역할: 전달받은 영화 목록(배열)을 화면에 카드로 그려줍니다.
const displayMovies = (movies, append = false) => {
    if (!append) {
        movieListDiv.innerHTML = '';
    }
    const likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || [];
    movies.forEach(movie => {
        const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
        const isLiked = likedMovies.includes(movie.id);
        const heartIcon = isLiked ? '❤️' : '♡';
        const movieCard = `
            <div class="movie-card-container">
                <a href="detail.html?id=${movie.id}" class="movie-card">
                    <img src="${posterPath}" alt="${movie.title} poster">
                    <h3>${movie.title}</h3>
                </a>
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${movie.id}">${heartIcon}</button>
            </div>
        `;
        movieListDiv.innerHTML += movieCard;
    });
};

// 역할: '로딩 중', '결과 없음' 등의 사용자 안내 메시지를 화면에 표시합니다.
const displayMessage = (message) => {
    const messageHTML = `<div class="message">${message}</div>`;
    movieListDiv.innerHTML = messageHTML;
};

// 역할: 주어진 카테고리에 맞는 영화 목록을 API로 가져옵니다.
const fetchMoviesByCategory = (category, page = 1) => {
    if(isLoading) return;
    isLoading = true;
    if(page === 1) displayMessage('로딩 중...');
    
    fetch(`${API_BASE_URL}/movie/${category}?language=ko-KR&page=${page}`, options)
        .then(response => response.json())
        .then(data => {
            let movies = data.results;
            if (category === 'now_playing') {
                const today = new Date();
                movies = movies.filter(movie => {
                    const releaseDate = new Date(movie.release_date);
                    return releaseDate <= today && (today - releaseDate) / (1000 * 60 * 60 * 24) < 120;
                });
            }
            displayMovies(movies, page > 1);
            if (data.page < data.total_pages) {
                loadMoreBtn.style.display ='block';
                currentPage = data.page;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        })
        .catch(err => {
            console.error(err);
            displayMessage('영화를 불러오는 데 실패했습니다.');
        })
        .finally(() => { isLoading = false; });
};

// 역할: '내가 찜한 영화' 목록을 불러오는 함수입니다.
const fetchLikedMovies = () => {
    displayMessage('찜한 영화를 불러오는 중...');
    const likedMovieIds = JSON.parse(localStorage.getItem('likedMovies')) || [];
    if (likedMovieIds.length === 0) {
        displayMessage('찜한 영화가 없습니다.');
        return;
    }
    const moviePromises = likedMovieIds.map(id =>
        fetch(`${API_BASE_URL}/movie/${id}?language=ko-KR`, options)
            .then(response => response.json())
    );
    Promise.all(moviePromises)
        .then(movies => {
            displayMovies(movies);
        })
        .catch(err => {
            console.error(err);
            displayMessage('찜한 영화를 불러오는 데 실패했습니다.');
        });
};

// 역할: API를 호출하여 주어진 검색어(query)에 대한 영화 목록을 가져옵니다.
const fetchSearchResults = (query, page = 1) => {
    if(isLoading) return;
    isLoading = true;
    if(page === 1) displayMessage('검색 중...');
    
    fetch(`${API_BASE_URL}/search/movie?query=${query}&language=ko-KR&page=${page}`, options)
        .then(response => response.json())
        .then(data => {
            if (page === 1 && data.results.length === 0) {
                displayMessage('검색 결과가 없습니다.');
                loadMoreBtn.style.display = 'none';
                return;
            }
            displayMovies(data.results, page > 1);
            if (data.page < data.total_pages) {
                loadMoreBtn.style.display = 'block';
                currentPage = data.page;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        })
        .catch(err => {
            console.error(err);
            displayMessage('검색에 실패했습니다.');
        })
        .finally(() => { isLoading = false; });
};

// 역할: 현재 활성화된 카테고리에 맞춰 버튼의 'active' 클래스를 업데이트합니다.
const updateActiveButton = (activeIdentifier) => {
    document.querySelectorAll('.filter-buttons .btn[data-category]').forEach(button => {
        if (button.dataset.category === activeIdentifier) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    if (activeIdentifier === 'liked') {
        showLikedBtn.classList.add('active');
    } else {
        showLikedBtn.classList.remove('active');
    }
};

// 역할: 저장된 페이지까지 모든 영화를 다시 불러오고 스크롤 위치를 복원합니다.
const restorePages = (state) => {
    const { targetPage, scrollY, url } = state;
    const params = new URLSearchParams(url.split('?')[1] || '');
    const query = params.get('query');
    const category = params.get('category') || (query ? null : 'popular');
    
    const promises = [];
    for (let i = 1; i <= targetPage; i++) {
        const fetchUrl = query
            ? `${API_BASE_URL}/search/movie?query=${query}&language=ko-KR&page=${i}`
            : `${API_BASE_URL}/movie/${category}?language=ko-KR&page=${i}`;
        promises.push(fetch(fetchUrl, options).then(res => res.json()));
    }

    displayMessage('페이지를 복원하는 중...');
    Promise.all(promises).then(results => {
        movieListDiv.innerHTML = '';
        results.forEach(data => displayMovies(data.results, true));
        
        const lastResult = results[results.length - 1];
        if (lastResult.page < lastResult.total_pages) {
            loadMoreBtn.style.display = 'block';
            currentPage = lastResult.page;
        } else {
            loadMoreBtn.style.display = 'none';
        }
        
        window.scrollTo(0, scrollY);
    });
};

/**
 * --------------------------------
 * 라우터(Router)
 * --------------------------------
 */
const router = () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const category = params.get('category');
    const list = params.get('list');

    if (query) {
        searchInput.value = query;
        fetchSearchResults(query, 1);
        updateActiveButton(null);
    } else if (list === 'liked') {
        fetchLikedMovies();
        loadMoreBtn.style.display = 'none';
        updateActiveButton('liked');
    } else if (category) {
        fetchMoviesByCategory(category, 1);
        updateActiveButton(category);
    } else {
        fetchMoviesByCategory('popular', 1);
        updateActiveButton('popular');
    }
};

/**
 * --------------------------------
 * 이벤트 리스너(Event Listeners)
 * --------------------------------
 */

// 이벤트: 사용자가 검색어를 입력하고 폼을 제출했을 때
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        history.pushState(null, '', `?query=${searchTerm}`);
        router();
    }
});

// 이벤트: '카테고리'와 '찜 목록' 버튼 클릭 시
filterButtons.addEventListener('click', (event) => {
    const button = event.target.closest('.btn');
    if (!button) return;
    searchInput.value = '';
    if (button.id === 'show-liked-btn') {
        history.pushState(null, '', '?list=liked');
    } else {
        const category = button.dataset.category;
        history.pushState(null, '', `?category=${category}`);
    }
    router();
});

/* 클릭 -> 찜하기, 영화 카드인지 구분해서 스크롤 상태 관리하기 */
movieListDiv.addEventListener('click', (event) => {
    // 1. 클릭된 요소가 '찜하기' 버튼인지 확인
    const likeBtn = event.target.closest('.like-btn');
    if (likeBtn) {
        event.preventDefault(); // 링크 이동을 막기 위해
        
        const movieId = parseInt(likeBtn.dataset.id);
        let likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || [];

        if (likedMovies.includes(movieId)) {
            likedMovies = likedMovies.filter(id => id !== movieId);
            likeBtn.classList.remove('liked');
            likeBtn.textContent = '♡';
        } else {
            likedMovies.push(movieId);
            likeBtn.classList.add('liked');
            likeBtn.textContent = '❤️';
        }
        localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
        return; // '찜하기' 로직은 여기서 끝
    }

    // 2. 클릭된 요소가 '영화 카드 링크'인지 확인
    const movieCardLink = event.target.closest('.movie-card');
    if (movieCardLink) {
        // 상세 페이지로 이동하기 '직전'에만 상태를 저장합니다.
        if (currentPage > 1) {
            const stateToSave = {
                targetPage: currentPage,
                scrollY: window.scrollY,
                url: window.location.href
            };
            sessionStorage.setItem('movieAppState', JSON.stringify(stateToSave));
        }
    }
});

// 이벤트: '더 보기' 버튼 클릭 시
loadMoreBtn.addEventListener('click', () => {
    const nextPage = currentPage + 1;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const category = params.get('category');
    if (query) {
        fetchSearchResults(query, nextPage);
    } else if (category) {
        fetchMoviesByCategory(category, nextPage);
    } else {
        fetchMoviesByCategory('popular', nextPage);
    }
});

// 이벤트: 페이지의 HTML이 처음 완전히 로드되었을 때
document.addEventListener('DOMContentLoaded', () => {
    const savedStateJSON = sessionStorage.getItem('movieAppState');
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.url === window.location.href) {
            sessionStorage.removeItem('movieAppState');
            restorePages(savedState);
            return;
        }
    }
    router();
});

// 이벤트: 브라우저의 뒤로 가기/앞으로 가기 버튼을 눌렀을 때
window.addEventListener('popstate', router);