import React from 'react'
import Speaker from '@/components/Speaker'
import StarRates from '@/components/StarRates'
import { LongmanResult, LongmanResultLex, LongmanResultRelated, LongmanResultEntry } from './engine'

export default class DictLongman extends React.PureComponent<{ result: LongmanResult }> {
  renderEntry (entry: LongmanResultEntry) {
    return (
      <section key={entry.title.HWD + entry.title.HOMNUM} className='dictLongman-Entry'>
        <header>
          <div className='dictLongman-HeaderContainer'>
            <h1 className='dictLongman-Title'>
              <span className='dictLongman-Title_HWD'>{entry.title.HWD}</span>
              <span className='dictLongman-Title_HYPHENATION'>{entry.title.HYPHENATION}</span>
              <span className='dictLongman-Title_HOMNUM'>{entry.title.HOMNUM}</span>
            </h1>
            {entry.level ? <StarRates rate={entry.level} className='dictLongman-Level' /> : null}
            {entry.freq && entry.freq.map(freq => (
              <span key={freq.rank} className='dictLongman-FREQ' title={freq.title}>{freq.rank}</span>
            ))}
          </div>
          <div className='dictLongman-HeaderContainer'>
            <span className='dictLongman-Pos'>{entry.pos}</span>
            <span className='dictLongman-Phsym'>{entry.phsym}</span>
            {entry.prons && entry.prons.map(pron => (
              <React.Fragment key={pron.pron}>
                {pron.lang.toUpperCase()}: <Speaker src={pron.pron} />
              </React.Fragment>
            ))}
            {entry.topic && (
              <>
                Topic: <a href={entry.topic.href} rel='nofollow'>{entry.topic.title}</a>
              </>
            )}
          </div>
        </header>

        {entry.senses.map(sen => (
          <div key={sen} className='dictLongman-Sense' dangerouslySetInnerHTML={{ __html: sen }} />
        ))}

        {entry.collocations &&
          <div className='dictLongman-Box' dangerouslySetInnerHTML={{ __html: entry.collocations }} />
        }

        {entry.grammar &&
          <div className='dictLongman-Box' dangerouslySetInnerHTML={{ __html: entry.grammar }} />
        }

        {entry.thesaurus &&
          <div className='dictLongman-Box' dangerouslySetInnerHTML={{ __html: entry.thesaurus }} />
        }

        {entry.examples && entry.examples.length > 0 && (
          <>
            <h2 className='dictLongman-Examples_Title'>Examples from the Corpus</h2>
            {entry.examples.map(exa => (
              <div key={exa} className='dictLongman-Examples' dangerouslySetInnerHTML={{ __html: exa }} />
            ))}
          </>
        )}
      </section>
    )
  }

  renderLex (result: LongmanResultLex) {
    type Dicts = ['bussiness', 'contemporary'] | ['contemporary', 'bussiness']
    // const dictTitle = {
    //   contemporary: 'Longman Dictionary of Contemporary English',
    //   bussiness: 'Longman Business Dictionary',
    // }
    const dicts: Dicts = result.bussinessFirst
      ? ['bussiness', 'contemporary']
      : ['contemporary', 'bussiness']

    return (
      <>
        {result.wordfams &&
          <div className='dictLongman-Wordfams' dangerouslySetInnerHTML={{ __html: result.wordfams }} />
        }

        {dicts.map(dict => result[dict].length > 0
          ? (
            <div className='dictLongman-Dict'>
              {/* <h1 className='dictLongman-DictTitle'>
                <span>- {dictTitle[dict]} -</span>
              </h1> */}
              {result[dict].map(this.renderEntry)}
            </div>
          )
          : null
        )}
      </>
    )
  }

  renderRelated (result: LongmanResultRelated) {
    return (
      <>
        <p>Did you mean:</p>
        <ul className='dictLongman-Related' dangerouslySetInnerHTML={{ __html: result.list }} />
      </>
    )
  }

  render () {
    const { result } = this.props
    switch (result.type) {
      case 'lex':
        return this.renderLex(result)
      case 'related':
        return this.renderRelated(result)
      default:
        return null
    }
  }
}
