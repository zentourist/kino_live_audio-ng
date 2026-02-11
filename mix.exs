defmodule KinoLiveAudio.MixProject do
  use Mix.Project

  @version "0.1.0"
  @source_url "https://github.com/yourusername/kino_live_audio"

  def project do
    [
      app: :kino_live_audio,
      version: @version,
      elixir: "~> 1.19",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases(),
      description: description(),
      package: package(),
      docs: docs(),
      name: "KinoLiveAudio",
      source_url: @source_url
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:kino, "~> 0.18.0"},
      {:tidewave, "~> 0.5.5", only: :dev},
      {:bandit, "~> 1.0", only: :dev},
      {:ex_doc, "~> 0.31", only: :dev, runtime: false}
    ]
  end

  defp aliases do
    [
      tidewave:
        "run --no-halt -e 'Agent.start(fn -> Bandit.start_link(plug: Tidewave, port: 4000) end)'"
    ]
  end

  defp description do
    """
    A modern Kino component for recording live audio from the browser in Livebook notebooks.
    Capture audio from the user's microphone using the Web Audio API and MediaRecorder.
    """
  end

  defp package do
    [
      licenses: ["MIT"],
      links: %{
        "GitHub" => @source_url
      },
      files: ~w(lib .formatter.exs mix.exs README.md LICENSE)
    ]
  end

  defp docs do
    [
      main: "KinoLiveAudio",
      source_ref: "v#{@version}",
      source_url: @source_url,
      extras: ["README.md"]
    ]
  end
end
