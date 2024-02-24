/**
 * 
 */
const dataDescriptors={
	'common[\\s-_]name':{ type: 'text', normalization: (s) => s.trim(), pattern: /^[\w]+[ \w]*$/, maxLength: 100, minLength: 5 }
}