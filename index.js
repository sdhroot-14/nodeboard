const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 3000;

// 세션 설정 
app.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: false
}));

// 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// 세션 데이터를 모든 ejs에서 user 변수로 사용 가능하도록 설정
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// 파일 제공
app.use(express.static('css'));

// 데이터 저장용
let users = [];
let posts = [];

// 회원가입 화면
app.get('/register', (req, res) => {
  res.render('register');
});

// 회원가입 처리
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    res.send(`
    <script>
      alert('이미 존재하는 아이디입니다.');
      history.back();
    </script>
  `);
  }
  users.push({ username, password });
  res.redirect('/login');
});

// 로그인 화면
app.get('/login', (req, res) => {
  res.render('login');
});

// 로그인 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user; // 세션에 유저 정보 저장
    res.redirect('/posts');
  } else {
    res.send(`
    <script>
      alert('로그인 실패! 아이디 또는 비밀번호를 확인하세요.');
      history.back();
    </script>
  `);
  }
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 오류:', err);
      return res.redirect('/posts');
    }
    res.clearCookie('connect.sid');
    res.redirect('/posts');
  });
});

// 게시글 목록
app.get('/posts', (req, res) => {
  res.render('posts', { posts });
});

// 글쓰기 폼 (로그인한 사람만 접근 가능)
app.get('/posts/new', (req, res) => {
  if (!req.session.user) return res.send(`
    <script>
      alert('로그인 후 이용 가능합니다!');
      history.back();
    </script>
  `);
  res.render('new_post', {user: req.session.user });
});


// 글쓰기 처리
app.post('/posts', (req, res) => {
  if (!req.session.user) return res.send(`
    <script>
      alert('로그인 후 이용 가능합니다!');
      history.back();
    </script>
  `);
  const { title, content } = req.body;
  posts.push({
    title,
    content,
    author: req.session.user.username
  });
  res.redirect('/posts');
});

// 게시글 상세보기
app.get('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts[id];
  if (!post) return res.send(`
    <script>
      alert('존재하지 않는 게시글입니다.');
      history.back();
    </script>
  `);
  res.render('post_detail', { post, id });
});

// 수정 폼 (작성자만 가능)
app.get('/posts/:id/edit', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts[id];
  if (!post) return res.send(`
    <script>
      alert('존재하지 않는 게시글입니다.');
      history.back();
    </script>
  `);
  if (!req.session.user || req.session.user.username !== post.author) {
    return res.send(`
    <script>
      alert('작성자만 수정 가능합니다.');
      history.back();
    </script>
  `);
  }
  res.render('edit_post', { post, id });
});

// 수정 처리
app.post('/posts/:id/edit', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts[id];
  if (!post) return res.send(`
    <script>
      alert('존재하지 않는 게시글입니다.');
      history.back();
    </script>
  `);
  if (!req.session.user || req.session.user.username !== post.author) {
    return res.send(`
    <script>
      alert('작성자만 수정 가능합니다.');
      history.back();
    </script>
  `);
  }

  post.title = req.body.title;
  post.content = req.body.content;
  res.redirect(`/posts/${id}`);
});

// 삭제 처리 (작성자만 가능)
app.post('/posts/:id/delete', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts[id];
  if (!post) return res.send(`
    <script>
      alert('존재하지 않는 게시글입니다.');
      history.back();
    </script>
  `);
  if (!req.session.user || req.session.user.username !== post.author) {
    return res.send(`
    <script>
      alert('작성자만 삭제 가능합니다.');
      history.back();
    </script>
  `);
  }

  posts.splice(id, 1);
  res.redirect('/posts');
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
