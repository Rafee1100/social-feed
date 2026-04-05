
import EventsSection from "./events/EventsSection";
import ExploreSection from "./explore/ExploreSection";
import styles from "./FeedLeftSidebar.module.css";

const FeedLeftSidebar = () => {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <ExploreSection />
        <EventsSection />
      </div>
    </div>
  );
};

export default FeedLeftSidebar;
