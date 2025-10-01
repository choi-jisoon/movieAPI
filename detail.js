
const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjYjkwN2I4NTcyNGVlZGI5YjI4NWY0MWU0Y2U3YjYzZiIsIm5iZiI6MTc1OTE5MTUyMC4zMjUsInN1YiI6IjY4ZGIyMWUwMzRkNTM1MTNhMTM4YzUyMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.eAtOrEXZ15JcdwAaPeuxt57zTsPmE__UPAPUGEsnDZY' 
    }
};

// --- 1. URL에서 영화 ID 가져오기 ---
// window.location.search는 URL의 ?id=12345 부분을 가져옵니다.
const searchParams = new URLSearchParams(window.location.search);
const movieId = searchParams.get('id'); // 'id' 파라미터의 값(예: 12345)을 가져옵니다.

// --- 2. ID를 이용해 특정 영화의 상세 정보 API 호출하기 ---
if (movieId) {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=ko-KR`, options)
        .then(response => response.json())
        .then(data => {
            // --- 3. 받아온 데이터로 화면 채우기 ---
            console.log(data); // 데이터가 어떻게 생겼는지 확인!

            const posterPath = data.poster_path;
            const fullPosterPath = `https://image.tmdb.org/t/p/w500${posterPath}`;

            document.getElementById('poster').src = fullPosterPath;
            document.getElementById('title').textContent = data.title;
            document.getElementById('overview').textContent = data.overview;
            document.getElementById('rating').textContent = data.vote_average.toFixed(1); // 소수점 한 자리까지
            document.getElementById('release-date').textContent = data.release_date;
        })
        .catch(err => console.error(err));
} else {
    // ID가 없는 경우에 대한 처리 (예: 에러 메시지 표시)
    document.getElementById('movie-detail').innerHTML = "영화 정보를 불러올 수 없습니다.";
}