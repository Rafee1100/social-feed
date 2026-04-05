import Link from "next/link";
import styles from "./SuggestedPersonCard.module.css";
import Image from "next/image";

export type SuggestedPerson = {
  name: string;
  title: string;
  image: string;
  profileHref?: string;
};

const SuggestedPersonCard = ({
  name,
  title,
  image,
  profileHref = "#0",
}: SuggestedPerson) => {
  return (
    <div className={styles.root}>
      <div className={styles.person}>
        <div className={styles.box}>
          <div className={styles.imageWrap}>
            <Link href={profileHref}>
              <Image
                src={image}
                alt="Image"
                className={styles.image}
                width={20}
                height={20}
              />
            </Link>
          </div>
          <div className={styles.text}>
            <Link href={profileHref}>
              <h4 className={styles.title}>{name}</h4>
            </Link>
            <p className={styles.description}>{title}</p>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.button}>
          Ignore
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonActive}`}
        >
          Follow
        </button>
      </div>
    </div>
  );
};

export default SuggestedPersonCard;
