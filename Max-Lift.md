{
  "page": {
    "id": "client-progress",
    "route": "/client/progress",
    "title": "Progress",
    "meta": {
      "description": "Track personal records and fitness-calculator results over time."
    },
    "sections": [
      {
        "type": "hero",
        "props": {
          "title": "Your Progress",
          "subtitle": "Track your max lifts and fitness calculations over time",
          "background": "gradient",
          "actions": [
            { "label": "Update Measurements", "variant": "primary", "id": "btn-update-measurements" }
          ]
        }
      },
      {
        "type": "tabs",
        "id": "progress-tabs",
        "props": {
          "defaultTab": "maxLifts",
          "items": [
            { "key": "maxLifts", "label": "Max Lifts" },
            { "key": "calculators", "label": "Calculators" }
          ]
        },
        "tabs": [
          {
            "key": "maxLifts",
            "layout": [
              {
                "type": "card",
                "id": "max-lift-chart",
                "props": {
                  "header": { "title": "Max Lift History", "description": "Personal-record progression" },
                  "body": {
                    "type": "chart",
                    "chartType": "line|radar",
                    "dataSource": "client_max_lifts",
                    "mapping": {
                      "x": "date_achieved",
                      "y": "max_weight",
                      "series": "workout_exercise_lists.name"
                    },
                    "height": 320,
                    "tooltip": true,
                    "legend": true
                  },
                  "footer": {
                    "stats": [
                      { "label": "Strongest lift ↑", "icon": "trending-up", "id": "max-lift-stat" }
                    ]
                  }
                }
              },
              {
                "type": "card",
                "id": "max-lift-table",
                "props": {
                  "header": { "title": "Max Lift Logs" },
                  "body": {
                    "type": "table",
                    "dataSource": "client_max_lifts",
                    "columns": [
                      { "key": "workout_exercise_lists.name", "label": "Exercise" },
                      { "key": "max_weight", "label": "Weight", "suffixField": "users_profile.weight_unit" },
                      { "key": "date_achieved", "label": "Date" },
                      { "key": "last_updated", "label": "Last Updated" },
                      { "key": "actions", "label": "Actions", "type": "icon-buttons" }
                    ],
                    "pagination": true
                  },
                  "footer": {
                    "actions": [
                      { "label": "Log New Max", "variant": "secondary", "id": "btn-new-max" }
                    ]
                  }
                }
              }
            ]
          },
          {
            "key": "calculators",
            "layout": [
              {
                "type": "card",
                "id": "calc-chart",
                "props": {
                  "header": { "title": "Calculator Results", "description": "Visual trends from BMI, BMR, body-fat, etc." },
                  "body": {
                    "type": "chart",
                    "chartType": "radar|line",
                    "dataSource": "calculator_sessions",
                    "mapping": {
                      "x": "created_at",
                      "y": "result",
                      "series": "calculator"
                    },
                    "height": 320,
                    "tooltip": true,
                    "legend": true
                  }
                }
              },
              {
                "type": "card",
                "id": "calc-table",
                "props": {
                  "header": { "title": "Calculator Session Logs" },
                  "body": {
                    "type": "table",
                    "dataSource": "calculator_sessions",
                    "columns": [
                      { "key": "calculator", "label": "Calculator Type" },
                      { "key": "result", "label": "Result" },
                      { "key": "result_unit", "label": "Unit" },
                      { "key": "created_at", "label": "Date" },
                      { "key": "actions", "label": "Actions", "type": "icon-buttons" }
                    ],
                    "pagination": true
                  }
                }
              }
            ]
          }
        ]
      },
      {
        "type": "footer",
        "props": {
          "links": [
            { "category": "Features", "items": ["Workout Plans", "Progress Tracking"] },
            { "category": "Resources", "items": ["Blog", "Guides", "Support"] },
            { "category": "Connect", "items": ["twitter", "youtube"] }
          ],
          "copyright":
            "© 2025 FitTrack. All rights reserved."
        }
      }
    ]
  }
}