# Contributing to KinoLiveAudio

Thank you for your interest in contributing to KinoLiveAudio! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/kino_live_audio.git`
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Run tests: `mix test`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to your fork: `git push origin my-feature`
8. Create a Pull Request

## Development Setup

### Prerequisites

- Elixir 1.19 or later
- Erlang/OTP 26 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kino_live_audio.git
cd kino_live_audio

# Install dependencies
mix deps.get

# Run tests
mix test

# Generate documentation
mix docs
```

### Testing in Livebook

To test your changes in Livebook:

1. Start Livebook
2. Create a new notebook
3. Install your local version:

```elixir
Mix.install([
  {:kino_live_audio, path: "/path/to/your/local/kino_live_audio"}
])
```

## Code Style

- Follow the [Elixir Style Guide](https://github.com/christopheradams/elixir_style_guide)
- Run `mix format` before committing
- Add typespecs to public functions
- Write comprehensive documentation for new features

## Testing

- Write tests for all new features
- Ensure existing tests pass
- Aim for high test coverage
- Test in multiple browsers when making JavaScript changes

```bash
# Run all tests
mix test

# Run tests with coverage
mix test --cover
```

## JavaScript Development

The JavaScript code is located in `lib/assets/live_audio/`:

- `main.js` - Main JavaScript logic
- `main.css` - Styling

When modifying JavaScript:

1. Test in multiple browsers (Chrome, Firefox, Safari)
2. Ensure backward compatibility
3. Handle errors gracefully
4. Add console logging for debugging

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)
- Add/update module documentation (`@moduledoc`)
- Add/update function documentation (`@doc`)
- Include examples in documentation

## Pull Request Guidelines

### Before Submitting

- [ ] Run `mix test` and ensure all tests pass
- [ ] Run `mix format` to format code
- [ ] Update documentation if needed
- [ ] Update CHANGELOG.md
- [ ] Test manually in Livebook
- [ ] Test in multiple browsers (for JavaScript changes)

### PR Description

Please include:

- A clear description of the changes
- The motivation for the changes
- Any breaking changes
- Screenshots for UI changes
- Steps to test the changes

## Reporting Issues

When reporting issues, please include:

- Elixir version (`elixir --version`)
- Erlang version (`erl -eval 'erlang:display(erlang:system_info(otp_release)), halt().' -noshell`)
- Browser version (if relevant)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages or logs

## Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case
- Consider if it fits the scope of the project

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Ask in the pull request
- Check existing issues and PRs

Thank you for contributing! 🎉
