# gitbook-plugin-surfacecode
Honkit plugin for visualizing quantum circuit.
Converting `{% surfacecode %} ... {% surfacecode %}` tags to the SVG image of quantum circuits using [two.js](https://two.js.org/).

## Install

`package.json`:

```json
{
    "devDependencies": {
        "gitbook-plugin-surfacecode": "git+https://github.com/kodack64/gitbook-plugin-surfacecode",
    }
}
```

`book.json`:

```json
{
	"plugins": [
		"surfacecode"
	]
}
```

then run `npm update` and `npx honkit serve`.

## Example

By inserting json-like object among the markdown, an interactive SVG components will be automatically inserted.

```
{% surfacecode %}
{
    type: "surface_code",
    distance: 5,
}
{% endsurfacecode %}
```


## Format

- `distance (int)`: (required) code distance.
- `type (str)`: (Any of "periodic", "normal", "rotated", "color-666", "color-666-periodic") Choose type of surface codes
- `interactive_edge (bool)`: (default to false) If true, user can switch error status of qubits by clicking edges.
- `interactive_face (bool)`: (default to false) If true, user can switch stabilizer operator by clicking faces.
- `error_type_x (bool)`: (default to true) If true, show edges for X-errors, vertices for Z-stabilizers, and faces for X-stabilizers.
- `error_type_z (bool)`: (default to true) Z/X flipped variant of `error_type_x`.
- `default_edge_x (list[int])`: (optional) list of identifiers that are affected by errors.
- `default_vertex_z (list[int])`: (optional) list of identifiers of active vertices.
- `default_edge_z (list[int])`: (optional) Z/X flipped variant of `default_edge_x`.
- `default_vertex_x (list[int])`: (optional) Z/X flipped variant of `default_vertex_x`.
