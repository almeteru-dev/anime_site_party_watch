package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type UserRating struct {
	ent.Schema
}

func (UserRating) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "user_ratings"},
	}
}

func (UserRating) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("id"),
		field.Int64("user_id"),
		field.Int64("anime_id"),
		field.Float("rating").
			SchemaType(map[string]string{dialect.Postgres: "numeric(3,1)"}).
			Min(0).
			Max(9),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (UserRating) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id", "anime_id").Unique(),
		index.Fields("anime_id"),
	}
}
