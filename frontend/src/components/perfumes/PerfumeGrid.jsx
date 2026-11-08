import PerfumeCard from "./PerfumeCard";

export default function PerfumeGrid({ perfumes = [], onRemovedFavorite }) {
  return (
    <div className="perfume-grid">
      {perfumes.map((perfume) => (
        <PerfumeCard
          key={perfume.id}
          perfume={perfume}
          onRemovedFavorite={onRemovedFavorite}
        />
      ))}
    </div>
  );
}

