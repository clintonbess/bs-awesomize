const Awesomize = require('../index');

describe('Awesomize interface to JavaScript', () => {
  const schema = Awesomize.compile({
    'foo': {
      read: ({ foo }) => foo,
      sanitize: (x) => x + 'bar',
      validate: [ Awesomize.Validate.required ],
      normalize: null,
    },
    'bar': {
      read: ({ bar }) => bar,
      sanitize: null,
      validate: [ Awesomize.Validate.required ],
      normalize: null,
    },
  });
  it('should respond with an error type', (done) => {
    schema({
      'foo': 'something',
    })
      .then((result) => {
        expect(result.awesomeResultType).toBe('Error');
        expect(result.data).toBeNull();
        expect(result.messages.foo).toBeNull();
        expect(result.messages.bar).toBe('required')
        done();
      });
  });
  it('should respond with a success type', (done) => {
    schema({
      'foo': 'thing1',
      'bar': 'thing2',
    })
      .then((result) => {
        expect(result.awesomeResultType).toBe('Ok');
        expect(result.messages).toBeNull();
        expect(result.data.foo).toBe('thing1bar');
        expect(result.data.bar).toBe('thing2');
        done();
      })
  });

  describe('Sanitizer', () => {
    const schema = Awesomize.compile({
      'foo': {
        read: ({ foo }) => foo,
        sanitize: (x) => x,
        validate: [ Awesomize.Validate.required ],
      },
    });

    it('should resolve with the value', (done) => {
      schema({ foo: 42 })

        .then(result => {
          expect(result.awesomeResultType).toBe('Ok');
          expect(result.messages).toBeNull();
          expect(result.data.foo).toBe(42);
          done();
        });
    });

  });

  describe('Field definition validation', () => {
    it('should throw when the schema is undefined', () => {
      expect(() => Awesomize.compile())
        
        .toThrowError(
          /^schema must be an 'object' received 'undefined'./
        );
    });
    it('should throw when the schema is not an object', () => {
      expect(() => Awesomize.compile(() => ({
        'bad': {
          read: ({ bad }) => bad,
          sanitize: (x) => 'moo' + x,
          validate: [ Awesomize.Validate.required ],
          normalize: (x) => x + 'moo',
        },
      })))
        
        .toThrowError(
          /^schema must be an 'object' received 'function'./
        );
    });
    it('should throw when the definition is not an object', () => {
      expect(() => Awesomize.compile({
        'bad': () => ({
          read: ({ bad }) => bad,
          sanitize: (x) => 'moo' + x,
          validate: [ Awesomize.Validate.required ],
          normalize: (x) => x + 'moo',
        }),
      }))
        
        .toThrowError(
          /^definition for 'bad' must be an 'object' received 'function'./
        );
    });
    it('should throw when the definition is null', () => {
      expect(() => Awesomize.compile({
        'bad': null,
      }))
        
        .toThrowError(
          /^definition for 'bad' must be an 'object' received 'null'./
        );
    });
    it('should throw when the validation property is not provided', () => {
      expect(() => Awesomize.compile({
        'bad': {
          read: ({ bad }) => bad,
          sanitize: (x) => x,
        },
      }))

        .toThrowError(/^validate property is required for 'bad'./);
    });

    it('should throw when the validate property is not an array', () => {
      expect(() => Awesomize.compile({
        'bad': {
          read: ({ bad }) => bad,
          validate: Awesomize.Validate.required,
          sanitize: (x) => x,
        },
      }))

        .toThrowError(/^validate property for 'bad' must be an array./);
    });

    it('should throw when a validator is not a function', () => {
      expect(() => Awesomize.compile({
        'bad': {
          read: ({ bad }) => bad,
          validate: [ Awesomize.Validate.required, 'moo' ],
          sanitize: (x) => x,
        },
      }))

        .toThrowError(
          /^validate property expects an Array<Function> received 'string' for 'bad' at index '1'/
        );
    });

    it('should throw when the read property is not provided', () => {
      expect(() => Awesomize.compile({
        'bad': {
          validate: [ Awesomize.Validate.required ],
          sanitized: (x) => x,
        },
      }))

        .toThrowError(/^read property is required for 'bad'./);
    });

    it('should throw when the sanitize property is not a function', () => {
      expect(() => Awesomize.compile({
        'bad': {
          read: ({ bad }) => bad,
          validate: [ Awesomize.Validate.required ],
          sanitize: [ (x) => x ],
        },
      }))

        .toThrowError(
          /^sanitize property expects 'function' received 'object' for 'bad'./
        );
    });
    it('should throw when the normalize property is not a function', () => {
      expect(() => Awesomize.compile({
        'bad': {
          read: ({ bad }) => bad,
          validate: [ Awesomize.Validate.required ],
          normalize: 'moo',
        },
      }))

        .toThrowError(
          /^normalize property expects 'function' received 'string' for 'bad'./
        );
    });
  });
});

describe('Awesomize Validator JavaScript.extern', () => {
  const greaterThanFive = (x) => x > 5;

  const validator = Awesomize.Validate.extern(
    greaterThanFive,
    "too_small"
  );

  let schema = Awesomize.compile({
    "foo": {
      read: ({ foo }) => foo,
      sanitize: null,
      validate: [ validator ],
      normalize: null,
    },
  });
  
  it("should fail when the target value is less than five", (done) => {
    schema({ foo: 2 })

      .then(result => {
        expect(result.awesomeResultType).toBe('Error');
        expect(result.data).toBeNull();
        expect(result.messages.foo).toBe("too_small");
        done();
      })
  });
  it("should pass when the target value is greater than five", (done) => {
    schema({ foo: 42 })

      .then(result => {
        expect(result.awesomeResultType).toBe('Ok');
        expect(result.messages).toBeNull();
        expect(result.data.foo).toBe(42);
        done();
      });
  });
  it("should pass when the target value is not present", (done) => {
    schema({})

      .then(result => {
        expect(result.awesomeResultType).toBe('Ok');
        expect(result.messages).toBeNull();
        expect(result.data.foo).toBeUndefined();
        done();
      });
  });
});

describe('Awesomize Validator JavaScript.externDependent', () => {
  const notEqual = (target, dependent, _sanitized) => {
    if (dependent == null) {
      return Promise.resolve(false);
    }
    return Promise.resolve(target !== dependent);
  };

  let validator =  Awesomize.Validate.externDependent(
    notEqual,
    "bar",
    "should_not_match"
  );

  const schema = Awesomize.compile({
    "foo": {
      read: ({ foo }) => foo,
      sanitize: null,
      validate: [ validator ],
      normalize: null,
    },
    "bar": {
      read: ({ bar }) => bar,
      sanitize: null,
      validate: [ Awesomize.Validate.required ],
      normalize: null,
    },
  });

  it("should fail when the dependent value is not present", (done) => {
    schema({ foo: 42 })

      .then(result => {
        expect(result.awesomeResultType).toBe('Error');
        expect(result.data).toBeNull();
        expect(result.messages.foo).toBe("should_not_match");
        expect(result.messages.bar).toBe("required");
        done();
      });
  });

  it("should fail when the dependent validator test fails", (done) => {
    schema({ foo: 42, bar: 42 })

      .then(result => {
        expect(result.awesomeResultType).toBe('Error');
        expect(result.data).toBeNull();
        expect(result.messages.foo).toBe("should_not_match");
        expect(result.messages.bar).toBeNull();
        done();
      });
  });

  it("should pass when the dependent validator test passes", (done) => {
    schema({ foo: 42, bar: 43 })

      .then((result) => {
        expect(result.awesomeResultType).toBe('Ok');
        expect(result.messages).toBeNull();
        expect(result.data.foo).toBe(42);
        expect(result.data.bar).toBe(43);
        done();
      });
  });

  describe("Synchronous validator", () => {
    const isEqual = (target, dependent, _sanitized) => (dependent == null)
      ? false
      : (target === dependent);

    const schema = Awesomize.compile({
      "foo": {
        read: ({ foo }) => foo,
        sanitize: null,
        validate: [
          Awesomize.Validate.externDependent(isEqual, "bar", "must_match"),
        ],
        normalize: null,
      },
      "bar": {
        read: ({ bar }) => bar,
        sanitize: null,
        validate: [ Awesomize.Validate.required ],
        normalize: null,
      },
    });

    it("should fail when the dependent value is not present", (done) => {
      schema({ foo: 42 })

        .then(result => {
          expect(result.awesomeResultType).toBe('Error');
          expect(result.data).toBeNull();
          expect(result.messages.foo).toBe("must_match");
          expect(result.messages.bar).toBe("required");
          done();
        });
    });

    it("should fail when the dependent validator test fails", (done) => {
      schema({ foo: 42, bar: 43 })

        .then(result => {
          expect(result.awesomeResultType).toBe('Error');
          expect(result.data).toBeNull();
          expect(result.messages.foo).toBe("must_match");
          expect(result.messages.bar).toBeNull();
          done();
        });
    });

    it("should pass when the dependent validator test passes", (done) => {
      schema({ foo: 42, bar: 42 })

        .then((result) => {
          expect(result.awesomeResultType).toBe('Ok');
          expect(result.messages).toBeNull();
          expect(result.data.foo).toBe(42);
          expect(result.data.bar).toBe(42);
          done();
        });
    });
  });
});
