import Link from "next/link";
import SuggestedPersonCard from "./SuggestedPersonCard";
import styles from "./Suggestions.module.css";
import { suggestedPeople } from "@/mockData";

const SuggestedPeopleSection = () => {
  return (
    <div
      className={`${styles.root} _padd_t24  _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area`}
    >
      <div className={`${styles.header} _mar_b24`}>
        <h4 className="_title5">You Might Like</h4>
        <span>
          <Link className={styles.headerLink} href="">
            See All
          </Link>
        </span>
      </div>
      <hr className={styles.divider} />
      {suggestedPeople.map((person) => (
        <SuggestedPersonCard
          key={person.name}
          name={person.name}
          title={person.title}
          image={person.image}
        />
      ))}
    </div>
  );
};

export default SuggestedPeopleSection;
