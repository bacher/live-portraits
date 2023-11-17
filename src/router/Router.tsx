import { Routes, Route, Link } from 'react-router-dom';

import { App } from '../editor/components/App';
import { Show } from '../show/components/Show';
import styles from './Router.module.css';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<MainMenu />} />
        <Route path="editor" element={<App />} />
        <Route path="show" element={<Show />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  );
}

function MainMenu() {
  return (
    <div className={styles.wrapper}>
      <Link className={styles.bigButton} to="/editor">
        Editor
      </Link>
      <Link className={styles.bigButton} to="/show">
        Show
      </Link>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
