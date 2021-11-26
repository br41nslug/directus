import { SchemaOverview } from '@directus/schema/dist/types/overview';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { FieldMeta, Type } from '@directus/shared/types';
import { getDatabaseClient } from '../database';
import getDatabase from '../database';

const localTypeMap: Record<string, Type | 'unknown'> = {
	// Shared
	boolean: 'boolean',
	tinyint: 'integer',
	smallint: 'integer',
	mediumint: 'integer',
	int: 'integer',
	integer: 'integer',
	serial: 'integer',
	bigint: 'bigInteger',
	bigserial: 'bigInteger',
	clob: 'text',
	tinytext: 'text',
	mediumtext: 'text',
	longtext: 'text',
	text: 'text',
	varchar: 'string',
	longvarchar: 'string',
	varchar2: 'string',
	nvarchar: 'string',
	image: 'binary',
	ntext: 'text',
	char: 'string',
	date: 'date',
	datetime: 'dateTime',
	dateTime: 'dateTime',
	timestamp: 'timestamp',
	time: 'time',
	float: 'float',
	double: 'float',
	'double precision': 'float',
	real: 'float',
	decimal: 'decimal',
	numeric: 'integer',

	// Geometries
	geometry: 'geometry',
	point: 'geometry.Point',
	linestring: 'geometry.LineString',
	polygon: 'geometry.Polygon',
	multipoint: 'geometry.MultiPoint',
	multilinestring: 'geometry.MultiLineString',
	multipolygon: 'geometry.MultiPolygon',

	// MySQL
	string: 'text',
	year: 'integer',
	blob: 'binary',
	mediumblob: 'binary',
	'int unsigned': 'integer',
	'tinyint unsigned': 'integer',
	'smallint unsigned': 'integer',
	'mediumint unsigned': 'integer',
	'bigint unsigned': 'integer',

	// MS SQL
	bit: 'boolean',
	smallmoney: 'float',
	money: 'float',
	datetimeoffset: 'timestamp',
	datetime2: 'dateTime',
	smalldatetime: 'dateTime',
	nchar: 'text',
	binary: 'binary',
	varbinary: 'binary',
	uniqueidentifier: 'uuid',

	// Postgres
	json: 'json',
	jsonb: 'json',
	uuid: 'uuid',
	int2: 'integer',
	serial4: 'integer',
	int4: 'integer',
	serial8: 'integer',
	int8: 'integer',
	bool: 'boolean',
	'character varying': 'string',
	character: 'string',
	interval: 'string',
	_varchar: 'string',
	bpchar: 'string',
	timestamptz: 'timestamp',
	'timestamp with time zone': 'timestamp',
	'timestamp with local time zone': 'timestamp',
	'timestamp without time zone': 'dateTime',
	'timestamp without local time zone': 'dateTime',
	timetz: 'time',
	'time with time zone': 'time',
	'time without time zone': 'time',
	float4: 'float',
	float8: 'float',

	// Oracle
	number: 'integer',
	sdo_geometry: 'geometry',

	// SQLite
	integerfirst: 'integer',
};

export default function getLocalType(
	column?: SchemaOverview[string]['columns'][string] | Column,
	field?: { special?: FieldMeta['special'] }
): Type | 'unknown' {
	const database = getDatabase();
	const databaseClient = getDatabaseClient(database);

	if (!column) return 'alias';

	const dataType = column.data_type.toLowerCase();
	const type = localTypeMap[dataType.split('(')[0]];

	const special = field?.special;

	if (special) {
		if (special.includes('json')) return 'json';
		if (special.includes('hash')) return 'hash';
		if (special.includes('csv')) return 'csv';
		if (special.includes('uuid')) return 'uuid';
		if (type?.startsWith('geometry')) {
			return (special[0] as Type) || 'geometry';
		}
	}

	/** Handle Postgres numeric decimals */
	if (dataType === 'numeric' && column.numeric_precision !== null && column.numeric_scale !== null) {
		return 'decimal';
	}

	/** Handle MS SQL varchar(MAX) (eg TEXT) types */
	if (column.data_type === 'nvarchar' && column.max_length === -1) {
		return 'text';
	}

	/** Handle Boolean as TINYINT and edgecase MySQL where it still is just tinyint */
	if (databaseClient === 'mysql' && dataType === 'tinyint(1)') {
		return 'boolean';
	}

	return type ?? 'unknown';
}
