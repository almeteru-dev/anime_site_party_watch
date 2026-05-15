package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Anime struct {
	ent.Schema
}

func (Anime) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "anime"},
	}
}

func (Anime) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("id"),
		field.String("name"),
		field.String("url"),
		field.String("image").Optional(),
		field.Float("average_rating").
			Default(0).
			SchemaType(map[string]string{dialect.Postgres: "numeric(3,1)"}),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (Anime) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("schedules", Schedule.Type),
	}
}
