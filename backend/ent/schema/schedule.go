package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type Schedule struct {
	ent.Schema
}

func (Schedule) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "schedules"},
	}
}

func (Schedule) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("id"),
		field.Int64("anime_id"),
		field.Time("release_datetime"),
		field.Int("episode_number"),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Schedule) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("anime", Anime.Type).Ref("schedules").Field("anime_id").Unique().Required(),
	}
}

func (Schedule) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("anime_id", "episode_number").Unique(),
		index.Fields("anime_id"),
		index.Fields("release_datetime"),
	}
}
