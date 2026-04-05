

import Suggestions from "./suggestions/Suggestions";
import styles from "./FeedRightSidebar.module.css";
import FriendsSection from "./friends/FriendsSection";

const FeedRightSidebar = () => {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <Suggestions />
      </div>
      <div className={styles.inner}>
        <FriendsSection />
      </div>
    </div>
  );
};

export default FeedRightSidebar;
